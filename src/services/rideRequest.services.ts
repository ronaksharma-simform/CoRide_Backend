import { prisma } from "@/config/prisma";
import { RideRequest } from "@/generated/prisma/client";
// import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
// import { Ride } from "@/validations/ride.validations";

import { TRideRequest } from "@/validations/rideRequest.validations";
import { RideService } from "./ride.services";
import AppError from "@/utils/customErrorClass";

export class RideRequestService {
  static readonly registerRideRequest = async (
    rideRequestRegistrationData: TRideRequest,
    userId: string,
  ): Promise<RideRequest> => {
    const rideWithExistingId = await RideService.getRideData(
      rideRequestRegistrationData.rideId,
    );
    if (!rideWithExistingId) {
      throw new AppError("RIDE_NOT_FOUND");
    }
    const point = `
POINT(
  ${rideRequestRegistrationData.sourcePoint.lng}
  ${rideRequestRegistrationData.sourcePoint.lat}
)
`;

    const rideDistanceQuery = `
SELECT
    ST_Distance(
        "route",
        ST_GeomFromText('${point}',4326)
    ) AS distance,
    ST_AsText(
        ST_ClosestPoint(
            "route",
            ST_GeomFromText('${point}', 4326)
        )
    ) AS closest_point
FROM "Ride" Order by distance LIMIT 5;
`;

    logger.debug(rideDistanceQuery);
    logger.debug(rideDistanceQuery);
    const rideDistanceData = await prisma.$queryRawUnsafe<
      {
        distance: number;
        closest_point: string;
      }[]
    >(rideDistanceQuery);
    logger.debug(rideDistanceData);
    const responseData = await prisma.$queryRaw<RideRequest[]>`
        INSERT INTO "RideRequest" (
          "rideId",
          "seekerId",
          "priority",
          "sourcePoint",
          "meetingPoint",
          "distanceToRoute",
          "status"
        ) VALUES (
          ${rideRequestRegistrationData.rideId},
          ${userId},
          ${rideRequestRegistrationData.priority},

      ST_GeographyFromText(
          ${`POINT(${rideRequestRegistrationData.sourcePoint.lng} ${rideRequestRegistrationData.sourcePoint.lat})`}
      ),
      ST_GeographyFromText(
          ${rideDistanceData[0].closest_point}
      ),
          ${rideDistanceData[0].distance},
          ${rideRequestRegistrationData.status}
        )
        RETURNING * ;
      `;
    logger.debug(responseData[0]);
    return responseData[0];
  };
}
