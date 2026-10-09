import { EventEmitter } from "node:events";
import { prisma } from "@/config/prisma";
import { RideStatus } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import { TLocation } from "@/validations/tracking.validations";

export const TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  ACTIVE: ["IN_PROGRESS", "CANCELLED"],
  FULL: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};
export const MAX_FIX_AGE_MS = 2 * 60 * 1000;
export const MAX_CLOCK_SKEW_MS = 30 * 1000;

/** Lifecycle updates for active rides: "status" and "location" events. */
export const tripEvents = new EventEmitter();

export const assertTransition = (from: RideStatus, to: RideStatus): void => {
  if (!TRANSITIONS[from].includes(to)) {
    throw new AppError("RIDE_INVALID_STATUS_TRANSITION");
  }
};

export const assertFreshFix = (
  recordedAt: Date,
  now: Date,
  lastRecordedAt?: Date,
): void => {
  const age = now.getTime() - recordedAt.getTime();
  if (age > MAX_FIX_AGE_MS || age < -MAX_CLOCK_SKEW_MS) {
    throw new AppError("RIDE_INVALID_LOCATION");
  }
  if (lastRecordedAt && recordedAt <= lastRecordedAt) {
    throw new AppError("RIDE_INVALID_LOCATION");
  }
};

export class TrackingService {
  private static readonly getOwnedRide = async (
    rideId: string,
    userId: string,
  ): Promise<{ id: string; status: RideStatus }> => {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { id: true, status: true, providerId: true },
    });
    if (!ride) throw new AppError("RIDE_NOT_FOUND");
    if (ride.providerId !== userId)
      throw new AppError("RIDE_UNAUTHORIZED_ACTION");
    return ride;
  };

  static readonly changeStatus = async (
    rideId: string,
    userId: string,
    to: RideStatus,
  ): Promise<{ id: string; status: RideStatus }> => {
    const ride = await this.getOwnedRide(rideId, userId);
    assertTransition(ride.status, to);
    const [updated] = await prisma.$transaction([
      prisma.ride.update({
        where: { id: rideId },
        data: { status: to },
        select: { id: true, status: true },
      }),
      prisma.rideStatusHistory.create({
        data: {
          rideId,
          fromStatus: ride.status,
          toStatus: to,
          changedBy: userId,
        },
      }),
    ]);
    logger.info({ rideId, from: ride.status, to }, "ride status changed");
    tripEvents.emit("status", { rideId, from: ride.status, to });
    return updated;
  };

  static readonly recordLocation = async (
    rideId: string,
    userId: string,
    point: TLocation,
  ): Promise<{ lat: number; lng: number; recordedAt: Date }> => {
    const ride = await this.getOwnedRide(rideId, userId);
    if (ride.status !== "IN_PROGRESS")
      throw new AppError("RIDE_NOT_IN_PROGRESS");
    const now = new Date();
    const recordedAt = point.recordedAt ?? now;
    const last = await prisma.rideLocation.findFirst({
      where: { rideId },
      orderBy: { recordedAt: "desc" },
      select: { recordedAt: true },
    });
    assertFreshFix(recordedAt, now, last?.recordedAt);
    const saved = await prisma.rideLocation.create({
      data: { rideId, userId, ...point, recordedAt },
      select: { lat: true, lng: true, recordedAt: true },
    });
    tripEvents.emit("location", { rideId, ...saved });
    return saved;
  };

  static readonly getStatus = async (rideId: string): Promise<unknown> => {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        status: true,
        locations: {
          orderBy: { recordedAt: "desc" },
          take: 1,
          select: { lat: true, lng: true, recordedAt: true },
        },
        statusHistory: {
          orderBy: { createdAt: "asc" },
          select: { fromStatus: true, toStatus: true, createdAt: true },
        },
      },
    });
    if (!ride) throw new AppError("RIDE_NOT_FOUND");
    const { locations, ...rest } = ride;
    return { ...rest, currentLocation: locations[0] ?? null };
  };
}
