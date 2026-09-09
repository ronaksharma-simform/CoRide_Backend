import { prisma } from "@/config/prisma";
import { Ride, Vehicle } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import {
  TRide,
  TRideAvailableSchema,
  TRideBookingDataSchema,
  TRideDataSchema,
  TRideSeatLayoutSchema,
  TRideSeatSchema,
  TRideUpdateSchema,
} from "@/validations/ride.validations";

const isUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: string }).code === "P2002";

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
  static readonly getAvailableRides = async (
    userId: string,
  ): Promise<TRideAvailableSchema[]> => {
    const userWithExistingId = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!userWithExistingId) throw new AppError("AUTH_USER_NOT_FOUND");
    const result = await prisma.$queryRaw<TRideAvailableSchema[]>`
    SELECT
      r.id,
      r."providerId",
      r."vehicleId",
      r."departureTime",
      r."totalSeats",
      r."availableSeats",
      r.status,
      r."createdAt",
      r."updatedAt",

      -- Convert POINT to { lat, lng } JSON object
      json_build_object(
        'lng', ST_X(r."sourceLabel"::geometry),
        'lat', ST_Y(r."sourceLabel"::geometry)
      ) AS "sourceLabel",

      -- Convert POINT to { lat, lng } JSON object
      json_build_object(
        'lng', ST_X(r."destinationLabel"::geometry),
        'lat', ST_Y(r."destinationLabel"::geometry)
      ) AS "destinationLabel",

      -- Convert LINESTRING into an array of { lat, lng } JSON objects
      (
        SELECT json_agg(json_build_object('lng', ST_X(geom), 'lat', ST_Y(geom)))
        FROM ST_DumpPoints(r."route"::geometry)
      ) AS route,

      json_build_object(
        'id', u.id,
        'firstName', u."firstName",
        'lastName', u."lastName",
        'username', u.username,
        'phone', u.phone,
        'avgRating', u."avgRating",
        'totalRides', u."totalRides"
      ) AS provider,

      json_build_object(
        'id', v.id,
        'company', v.company,
        'model', v.model,
        'color', v.color,
        'plateNumber', v."plateNumber",
        'seatCapacity', v."seatCapacity"
      ) AS vehicle

    FROM "Ride" r
    JOIN "User" u ON u.id = r."providerId"
    JOIN "Vehicle" v ON v.id = r."vehicleId"
    WHERE r.status = 'ACTIVE'
      AND r."providerId" <> ${userId}
      AND r."availableSeats" > 0
    ORDER BY r."departureTime" ASC
  `;
    return result;
  };
  static readonly getRideSeatLayout = async (
    rideId: string,
    userId: string,
  ): Promise<TRideSeatLayoutSchema> => {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        vehicle: true,
        bookings: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!ride) throw new AppError("RIDE_NOT_FOUND");
    const seats: TRideSeatSchema[] = Array.from(
      { length: ride.totalSeats },
      (_value, index) => {
        const seatNumber = index + 1;
        if (seatNumber === 1) {
          return {
            seatNumber,
            kind: "driver" as const,
            status: "driver" as const,
            bookedBy: null,
          };
        }
        const booking = ride.bookings.find(
          (item) => item.seatNumber === seatNumber,
        );
        if (booking) {
          const bookedBy = {
            id: booking.user.id,
            name: `${booking.user.firstName} ${booking.user.lastName}`.trim(),
          };
          return {
            seatNumber,
            kind: "passenger" as const,
            status: "booked" as const,
            bookedBy,
          };
        }
        return {
          seatNumber,
          kind: "passenger" as const,
          status: "available" as const,
          bookedBy: null,
        };
      },
    );
    const myBooking = ride.bookings.find(
      (booking) => booking.userId === userId,
    );
    return {
      ride: {
        id: ride.id,
        providerId: ride.providerId,
        vehicleId: ride.vehicleId,
        departureTime: ride.departureTime,
        totalSeats: ride.totalSeats,
        availableSeats: ride.availableSeats,
        status: ride.status,
      },
      vehicle: {
        id: ride.vehicle.id,
        company: ride.vehicle.company,
        model: ride.vehicle.model,
        color: ride.vehicle.color,
        plateNumber: ride.vehicle.plateNumber,
        seatCapacity: ride.vehicle.seatCapacity,
      },
      seats,
      myBooking: myBooking?.seatNumber ?? null,
    };
  };
  static readonly bookSeat = async (
    rideId: string,
    userId: string,
    seatNumber: number,
  ): Promise<TRideBookingDataSchema> => {
    return prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw new AppError("RIDE_NOT_FOUND");
      if (ride.providerId === userId) {
        throw new AppError("RIDE_CANNOT_JOIN_OWN_RIDE");
      }
      if (!Number.isInteger(seatNumber) || seatNumber < 1) {
        throw new AppError("SEAT_INVALID_NUMBER");
      }
      if (seatNumber > ride.totalSeats) {
        throw new AppError("SEAT_INVALID_NUMBER");
      }
      if (seatNumber === 1) {
        throw new AppError("SEAT_DRIVER_SEAT_NOT_BOOKABLE");
      }
      if (ride.status === "FULL") {
        throw new AppError("RIDE_SEATS_NOT_AVAILABLE");
      }
      if (ride.status === "COMPLETED") {
        throw new AppError("RIDE_ALREADY_COMPLETED");
      }
      if (ride.status === "CANCELLED") {
        throw new AppError("RIDE_ALREADY_CANCELLED");
      }
      if (ride.availableSeats <= 0) {
        throw new AppError("RIDE_SEATS_NOT_AVAILABLE");
      }
      const existingBooking = await tx.rideBooking.findUnique({
        where: { rideId_userId: { rideId, userId } },
      });
      if (existingBooking) throw new AppError("RIDE_ALREADY_JOINED");
      const existingSeatBooking = await tx.rideBooking.findUnique({
        where: { rideId_seatNumber: { rideId, seatNumber } },
      });
      if (existingSeatBooking) throw new AppError("SEAT_ALREADY_BOOKED");
      try {
        const booking = await tx.rideBooking.create({
          data: { rideId, userId, seatNumber },
        });
        const remainingSeats = ride.availableSeats - 1;
        const updatedRide = await tx.ride.update({
          where: { id: rideId },
          data: {
            availableSeats: { decrement: 1 },
            status: remainingSeats <= 0 ? "FULL" : ride.status,
          },
        });
        logger.debug("Seat booked on ride");
        logger.debug(booking);
        return {
          booking: {
            id: booking.id,
            rideId: booking.rideId,
            userId: booking.userId,
            seatNumber: booking.seatNumber,
            status: booking.status,
            createdAt: booking.createdAt,
          },
          ride: {
            id: updatedRide.id,
            availableSeats: updatedRide.availableSeats,
            totalSeats: updatedRide.totalSeats,
            status: updatedRide.status,
          },
        };
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new AppError("SEAT_ALREADY_BOOKED");
        }
        throw error;
      }
    });
  };
}
