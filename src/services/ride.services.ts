import { prisma } from "@/config/prisma";
import { Prisma, Ride, Vehicle } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import { TRide, TRideUpdateSchema } from "@/validations/ride.validations";

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
    let resultantString = "";
    for (const cooridinate of data) {
      resultantString += `${cooridinate.lng} ${cooridinate.lat},\n`;
    }
    resultantString = resultantString.substring(0, resultantString.length - 1);
    logger.debug(resultantString);
    return resultantString;
  };
  static readonly deleteRide = async (id: string): Promise<Ride> => {
    try {
      const deletedRide = await prisma.ride.delete({ where: { id } });
      return deletedRide;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError("RIDE_NOT_FOUND");
      }

      throw error;
    }
  };
  static readonly updateRide = async (
    rideUpdateData: TRideUpdateSchema,
    id: string,
  ): Promise<void> => {
    const updates: string[] = [];
    if (rideUpdateData?.status !== undefined) {
      updates.push(`"status" = ${rideUpdateData.status}`);
    }
    if (rideUpdateData?.sourceLabel !== undefined) {
      updates.push(`"sourceLabel" = ST_GeographyFromText('
        ${`POINT(${rideUpdateData.sourceLabel.lng} ${rideUpdateData.sourceLabel.lat})`}')`);
    }
    if (rideUpdateData?.destinationLabel !== undefined) {
      updates.push(`"sourceLabel" = ST_GeographyFromText('
        ${`POINT(${rideUpdateData.destinationLabel.lng} ${rideUpdateData.destinationLabel.lat})`}')`);
    }
    if (rideUpdateData?.totalSeats !== undefined) {
      updates.push(`totalSeats = ${rideUpdateData.totalSeats}`);
    }
    if (rideUpdateData?.availableSeats !== undefined) {
      updates.push(`availableSeats = ${rideUpdateData.availableSeats}`);
    }
    if (rideUpdateData?.departureTime !== undefined) {
      updates.push(`departureTime = ${rideUpdateData.departureTime}`);
    }
    if (rideUpdateData?.route !== undefined) {
      updates.push(`route = ST_GeographyFromText('
        ${`LINESTRING(
           ${this.createLineString(rideUpdateData.route)}
        )`}
    ')`);
    }
    const query = `
        UPDATE "Ride" 
        SET ${updates.join(", ")}
        WHERE id = '${id}'
        `;
    logger.debug(query);
    await prisma.$queryRawUnsafe(query);
  };
}
