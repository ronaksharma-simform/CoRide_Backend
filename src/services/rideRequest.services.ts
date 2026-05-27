import { prisma } from "@/config/prisma";
import { RideRequest } from "@/generated/prisma/client";
// import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
// import { Ride } from "@/validations/ride.validations";

import { TRideRequest } from "@/validations/rideRequest.validations";
import { RideService } from "./ride.services";

export class RideRequestService {
  static readonly registerRideRequest = async (
    rideRequestRegistrationData: TRideRequest,
    userId: string,
  ): Promise<RideRequest> => {
    const rideWithExistingId = await RideService.getRideData(
      rideRequestRegistrationData.rideId,
    );

    //     select ST_DISTANCE("route","destinationLabel") , ST_asText( ST_ClosestPoint("route"::geometry,"destinationLabel"::"geometry") ),
    //           St_asText("route")
    // from "Ride";
    logger.debug(rideWithExistingId);
    const responseData = await prisma.$queryRaw<RideRequest[]>`
      INSERT INTO "RideRequest" (
        "rideId",
        "seekerId",
        "priority",
        "meetingPoint",
        "distanceToRoute",
        "status"
      ) VALUES (
        ${rideRequestRegistrationData.rideId},
        ${userId},
        ${rideRequestRegistrationData.priority},
        
    ST_GeographyFromText(
        ${`POINT(${rideRequestRegistrationData.meetingPoint.lng} ${rideRequestRegistrationData.meetingPoint.lat})`}
    ),
        ${rideRequestRegistrationData.distanceToRoute},
        ${rideRequestRegistrationData.status}
      )
      RETURNING * ;
    `;
    return responseData[0];
  };
}
