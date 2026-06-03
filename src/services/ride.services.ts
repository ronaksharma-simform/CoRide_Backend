import { prisma } from "@/config/prisma";
import { Ride } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import {
  TRideDataSchema,
  TRideUpdateSchema,
} from "@/validations/ride.validations";

export class RideService {
  static readonly createRide = async (
    rideRegistrationData: TRideDataSchema,
    userId: string,
  ): Promise<TRideDataSchema> => {
    const vehicleWithExistingId = await prisma.vehicle.findUnique({
      where: { id: rideRegistrationData.vehicleId },
    });
    if (!vehicleWithExistingId) {
      throw new AppError("VEHICLE_NOT_FOUND");
    }
    logger.debug("Creating ride with data: ");
    logger.debug(rideRegistrationData);
    const responseData = await prisma.$queryRaw<TRideDataSchema[]>`
 INSERT INTO "Ride" (
    "providerId",
    "vehicleId",
    "sourceLabel",
    "destinationLabel",
    "route",
    "departureTime",
    "totalSeats",
    "availableSeats",
    "status"
)
VALUES (
    ${userId},
    ${rideRegistrationData.vehicleId},

    ST_GeographyFromText(
        ${`POINT(${rideRegistrationData.sourceLabel.lng} ${rideRegistrationData.sourceLabel.lat})`}
    ),

    ST_GeographyFromText(
        ${`POINT(${rideRegistrationData.destinationLabel.lng} ${rideRegistrationData.destinationLabel.lat})`}
    ),

    ST_GeographyFromText(
        ${`LINESTRING(
           ${this.createLineString(rideRegistrationData.route)}
        )`}
    ),

    ${rideRegistrationData.departureTime},
    ${rideRegistrationData.totalSeats},
    ${rideRegistrationData.availableSeats},
    ${rideRegistrationData.status}
)
RETURNING *
`;
    responseData[0].sourceLabel = rideRegistrationData.sourceLabel;
    responseData[0].destinationLabel = rideRegistrationData.destinationLabel;
    responseData[0].route = rideRegistrationData.route;
    // console.log(responseData[0]);
    return responseData[0];
  };
  static readonly createLineString = (
    data: { lat: number; lng: number }[],
  ): string => {
    return data.map((point) => `${point.lng} ${point.lat}`).join(", ");
  };
  static readonly deleteRide = async (id: string): Promise<TRideDataSchema> => {
    const rideWithExistingId = await this.getRideData(id);
    if (!rideWithExistingId) throw new AppError("RIDE_NOT_FOUND");
    await prisma.ride.delete({ where: { id } });
    return rideWithExistingId;
  };
  static readonly updateRide = async (
    rideUpdateData: TRideUpdateSchema,
    id: string,
  ): Promise<TRideDataSchema> => {
    const rideWithExistingId = await this.getRideData(id);
    if (!rideWithExistingId) throw new AppError("RIDE_NOT_FOUND");
    const updates: string[] = [];
    if (rideUpdateData?.status !== undefined) {
      updates.push(`"status" = '${rideUpdateData.status}'`);
    }
    if (rideUpdateData?.sourceLabel !== undefined) {
      updates.push(`"sourceLabel" = ST_GeographyFromText('
        ${`POINT(${rideUpdateData.sourceLabel.lng} ${rideUpdateData.sourceLabel.lat})`}')`);
    }
    if (rideUpdateData?.destinationLabel !== undefined) {
      updates.push(`"destinationLabel" = ST_GeographyFromText('
        ${`POINT(${rideUpdateData.destinationLabel.lng} ${rideUpdateData.destinationLabel.lat})`}')`);
    }
    if (rideUpdateData?.totalSeats !== undefined) {
      updates.push(`"totalSeats" = ${rideUpdateData.totalSeats}`);
    }
    if (rideUpdateData?.availableSeats !== undefined) {
      updates.push(`"availableSeats" = ${rideUpdateData.availableSeats}`);
    }
    if (rideUpdateData?.departureTime !== undefined) {
      updates.push(`"departureTime" = '${rideUpdateData.departureTime}'`);
    }
    if (rideUpdateData?.route !== undefined) {
      updates.push(`"route" = ST_GeographyFromText('
        ${`LINESTRING(
           ${this.createLineString(rideUpdateData.route)}
        )`}
    ')`);
    }
    if (updates.length === 0) {
      throw new AppError("RIDE_NO_DATA_TO_UPDATE");
    }
    const query = `
        UPDATE "Ride" 
        SET ${updates.join(", ")}
        WHERE id = '${id}'
        returning *
        `;
    await prisma.$queryRawUnsafe<Ride[]>(query);

    return {
      ...rideWithExistingId,
      ...(rideUpdateData.status !== undefined
        ? { status: rideUpdateData.status }
        : {}),
      ...(rideUpdateData.sourceLabel !== undefined
        ? { sourceLabel: rideUpdateData.sourceLabel }
        : {}),
      ...(rideUpdateData.destinationLabel !== undefined
        ? { destinationLabel: rideUpdateData.destinationLabel }
        : {}),
      ...(rideUpdateData.totalSeats !== undefined
        ? { totalSeats: rideUpdateData.totalSeats }
        : {}),
      ...(rideUpdateData.availableSeats !== undefined
        ? { availableSeats: rideUpdateData.availableSeats }
        : {}),
      ...(rideUpdateData.departureTime !== undefined
        ? { departureTime: rideUpdateData.departureTime }
        : {}),
      ...(rideUpdateData.route !== undefined
        ? { route: rideUpdateData.route }
        : {}),
    };
  };
  static readonly getRideData = async (
    id: string,
  ): Promise<TRideDataSchema> => {
    const rideWithExistingId = await prisma.ride.findUnique({
      where: { id },
    });
    if (!rideWithExistingId) throw new AppError("RIDE_NOT_FOUND");
    const result = await prisma.$queryRaw<TRideDataSchema[]>`
    SELECT 
      id,
      "providerId",
      "vehicleId",
      "departureTime",
      "totalSeats",
      "availableSeats",
      status,
      "createdAt",
      "updatedAt",
      
      -- Convert POINT to { lat, lng } JSON object
      json_build_object(
        'lng', ST_X("sourceLabel"::geometry),
        'lat', ST_Y("sourceLabel"::geometry)
      ) AS "sourceLabel",

      -- Convert POINT to { lat, lng } JSON object
      json_build_object(
        'lng', ST_X("destinationLabel"::geometry),
        'lat', ST_Y("destinationLabel"::geometry)
      ) AS "destinationLabel",

      -- Convert LINESTRING into an array of { lat, lng } JSON objects
      (
        SELECT json_agg(json_build_object('lng', ST_X(geom), 'lat', ST_Y(geom)))
        FROM ST_DumpPoints("route"::geometry)
      ) AS "route"

    FROM "Ride"
    WHERE "id" = ${id}::uuid;
  `;
    return result[0];
  };
  static readonly getUserRide = async (
    id: string,
  ): Promise<TRideDataSchema[]> => {
    const userWithExistingId = await prisma.user.findUnique({
      where: { id },
    });
    if (!userWithExistingId) throw new AppError("AUTH_USER_NOT_FOUND");
    const result = await prisma.$queryRaw<TRideDataSchema[]>`
    SELECT 
      id,
      "providerId",
      "vehicleId",
      "departureTime",
      "totalSeats",
      "availableSeats",
      status,
      "createdAt",
      "updatedAt",
      json_build_object(
        'lng', ST_X("sourceLabel"::geometry),
        'lat', ST_Y("sourceLabel"::geometry)
      ) AS "sourceLabel",
      json_build_object(
        'lng', ST_X("destinationLabel"::geometry),
        'lat', ST_Y("destinationLabel"::geometry)
      ) AS "destinationLabel",
      (
        SELECT json_agg(json_build_object('lng', ST_X(geom), 'lat', ST_Y(geom)))
        FROM ST_DumpPoints("route"::geometry)
      ) AS "route"

    FROM "Ride"
    where "providerId" = ${id}
  `;
    return result;
  };
}
