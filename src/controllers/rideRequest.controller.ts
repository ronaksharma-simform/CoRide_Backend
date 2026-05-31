import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import { RideRequestService } from "@/services/rideRequest.services";
import { RequestHandler } from "express";

export const registerRideRequest: RequestHandler = async (req, res) => {
  const responseData = await RideRequestService.registerRideRequest(
    req.body,
    req.user.id,
  );
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "Ride Request Created Sucessfully",
    data: responseData,
  });
};
