import { prisma } from "@/config/prisma";
import { Ride, Vehicle } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import {
  TRide,
  TRideDataSchema,
  TRideUpdateSchema,
} from "@/validations/ride.validations";

export class RideService {
  static readonly createRide = async (
    rideRegistrationData: TRide,
    userId: string,
  ): Promise<Vehicle> => {
    const vehicleWithExistingId = await prisma.vehicle.findUnique({
      where: { id: rideRegistrationData.vehicleId },
    });
    if (!vehicleWithExistingId) {
      throw new AppError("VEHICLE_NOT_FOUND");
    }
    logger.debug("Creating ride with data: ");
    logger.debug(rideRegistrationData);
    const responseData = await prisma.$queryRaw<Vehicle[]>`
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
    return responseData[0];
  };
  static readonly createLineString = (
    data: { lat: number; lng: number }[],
  ): string => {
    return data.map((point) => `${point.lng} ${point.lat}`).join(", ");
  };
  static readonly deleteRide = async (id: string): Promise<Ride> => {
    const rideWithExistingId = await prisma.ride.findUnique({
      where: { id },
    });
    if (!rideWithExistingId) throw new AppError("RIDE_NOT_FOUND");
    const deletedRide = await prisma.ride.delete({ where: { id } });
    return deletedRide;
  };
  static readonly updateRide = async (
    rideUpdateData: TRideUpdateSchema,
    id: string,
  ): Promise<Ride> => {
    const rideWithExistingId = await prisma.ride.findUnique({
      where: { id },
    });
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
    const updatedRide = await prisma.$queryRawUnsafe<Ride[]>(query);
    return updatedRide[0];
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
