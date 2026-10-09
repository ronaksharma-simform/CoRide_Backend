import { prisma } from "@/config/prisma";
import { MatchEventType, Prisma, RideRequest } from "@/generated/prisma/client";
import {
  canApply,
  MATCH_RADIUS_METERS,
  MatchAction,
} from "@/services/match.rules";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import { TMatchRequest } from "@/validations/match.validations";

type Tx = Prisma.TransactionClient;

const logEvent = async (
  tx: Tx,
  request: RideRequest,
  type: MatchEventType,
  rideId: string | null,
): Promise<void> => {
  await tx.matchEvent.create({ data: { requestId: request.id, rideId, type } });
  logger.info({ requestId: request.id, rideId, type }, "match event");
};

const load = async (
  tx: Tx,
  id: string,
  action: MatchAction,
  actorId: string,
  as: "rider" | "driver",
): Promise<RideRequest> => {
  const request = await tx.rideRequest.findUnique({
    where: { id },
    include: { ride: { select: { providerId: true } } },
  });
  if (!request) throw new AppError("MATCH_REQUEST_NOT_FOUND");
  if (!canApply(request.status, action))
    throw new AppError("MATCH_INVALID_STATE");
  const owner = as === "rider" ? request.riderId : request.ride?.providerId;
  if (owner !== actorId) throw new AppError("RIDE_UNAUTHORIZED_ACTION");
  return request;
};

/** Nearest ACTIVE ride with a free seat, near both pickup and destination. */
const findNearest = async (
  tx: Tx,
  request: RideRequest,
  excluded: string[],
): Promise<string | null> => {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT r.id
    FROM "Ride" r
    WHERE r.status = 'ACTIVE'
      AND r."availableSeats" > 0
      AND r."departureTime" > now()
      AND r."providerId" <> ${request.riderId}
      AND NOT (r.id = ANY(${excluded}::uuid[]))
      AND ST_DWithin(r."sourceLabel",
            ST_SetSRID(ST_MakePoint(${request.pickupLng}, ${request.pickupLat}), 4326)::geography,
            ${MATCH_RADIUS_METERS})
      AND ST_DWithin(r."destinationLabel",
            ST_SetSRID(ST_MakePoint(${request.destinationLng}, ${request.destinationLat}), 4326)::geography,
            ${MATCH_RADIUS_METERS})
    ORDER BY ST_Distance(r."sourceLabel",
            ST_SetSRID(ST_MakePoint(${request.pickupLng}, ${request.pickupLat}), 4326)::geography) ASC,
      r."departureTime" ASC
    LIMIT 1`;
  return rows[0]?.id ?? null;
};

/** Offer the request to the best ride not yet rejected; NO_DRIVERS when none is left. */
export const assign = async (
  tx: Tx,
  request: RideRequest,
): Promise<RideRequest> => {
  const rejected = await tx.matchEvent.findMany({
    where: { requestId: request.id, type: "REJECTED" },
    select: { rideId: true },
  });
  const excluded = rejected.flatMap((e) => (e.rideId ? [e.rideId] : []));
  const rideId = await findNearest(tx, request, excluded);
  const updated = await tx.rideRequest.update({
    where: { id: request.id },
    data: rideId
      ? { status: "ASSIGNED", rideId }
      : { status: "NO_DRIVERS", rideId: null },
  });
  await logEvent(tx, updated, rideId ? "ASSIGNED" : "NO_DRIVERS", rideId);
  return updated;
};

export const requestMatch = async (
  tx: Tx,
  riderId: string,
  input: TMatchRequest,
): Promise<RideRequest> => {
  const request = await tx.rideRequest.create({
    data: {
      riderId,
      pickupLat: input.pickup.lat,
      pickupLng: input.pickup.lng,
      destinationLat: input.destination.lat,
      destinationLng: input.destination.lng,
    },
  });
  await logEvent(tx, request, "REQUESTED", null);
  return assign(tx, request);
};

export const acceptMatch = async (
  tx: Tx,
  id: string,
  driverId: string,
): Promise<RideRequest> => {
  const request = await load(tx, id, "accept", driverId, "driver");
  // Atomic seat claim: loses cleanly if another rider took the last seat.
  const claimed = await tx.ride.updateMany({
    where: { id: request.rideId!, status: "ACTIVE", availableSeats: { gt: 0 } },
    data: { availableSeats: { decrement: 1 } },
  });
  if (claimed.count === 0) {
    await logEvent(tx, request, "REJECTED", request.rideId);
    return assign(tx, request);
  }
  await tx.ride.updateMany({
    where: { id: request.rideId!, availableSeats: 0 },
    data: { status: "FULL" },
  });
  const accepted = await tx.rideRequest.update({
    where: { id },
    data: { status: "ACCEPTED" },
  });
  await logEvent(tx, accepted, "ACCEPTED", accepted.rideId);
  return accepted;
};

export const rejectMatch = async (
  tx: Tx,
  id: string,
  driverId: string,
): Promise<RideRequest> => {
  const request = await load(tx, id, "reject", driverId, "driver");
  await logEvent(tx, request, "REJECTED", request.rideId);
  return assign(tx, request); // reassignment
};

export const cancelMatch = async (
  tx: Tx,
  id: string,
  riderId: string,
): Promise<RideRequest> => {
  const request = await load(tx, id, "cancel", riderId, "rider");
  if (request.status === "ACCEPTED" && request.rideId) {
    await tx.ride.updateMany({
      where: { id: request.rideId },
      data: { availableSeats: { increment: 1 } },
    });
    await tx.ride.updateMany({
      where: { id: request.rideId, status: "FULL" },
      data: { status: "ACTIVE" },
    });
  }
  const cancelled = await tx.rideRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  await logEvent(tx, cancelled, "CANCELLED", cancelled.rideId);
  return cancelled;
};

export class MatchService {
  static readonly request = (
    riderId: string,
    input: TMatchRequest,
  ): Promise<RideRequest> =>
    prisma.$transaction((tx) => requestMatch(tx, riderId, input));
  static readonly accept = (
    id: string,
    driverId: string,
  ): Promise<RideRequest> =>
    prisma.$transaction((tx) => acceptMatch(tx, id, driverId));
  static readonly reject = (
    id: string,
    driverId: string,
  ): Promise<RideRequest> =>
    prisma.$transaction((tx) => rejectMatch(tx, id, driverId));
  static readonly cancel = (
    id: string,
    riderId: string,
  ): Promise<RideRequest> =>
    prisma.$transaction((tx) => cancelMatch(tx, id, riderId));
}
