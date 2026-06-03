import { HTTP_STATUS_CODES } from "@/constants/httpCodes";

import { RideService } from "@/services/ride.services";
import { logger } from "@/utils/logger";

import { RequestHandler } from "express";

export const registerRide: RequestHandler = async (req, res) => {
  const responseData = await RideService.createRide(req.body, req.user.id);

  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,

    message: "Ride created sucessfully",

    data: responseData,
  });
};

export const deleteRide: RequestHandler = async (req, res) => {
  const responseData = await RideService.deleteRide(req.params.id as string);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,

    message: "Ride Deleted sucessfully",
    data: responseData,
  });
};

export const updateRide: RequestHandler = async (req, res) => {
  const responseData = await RideService.updateRide(
    req.body,
    req.params.id as string,
  );

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,

    message: "Ride Updated sucessfully",

    data: responseData,
  });
};

export const getRideData: RequestHandler = async (req, res) => {
  const responseData = await RideService.getRideData(req.params.id as string);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,

    message: "Ride Data ",

    data: responseData,
  });
};

export const getUserRide: RequestHandler = async (req, res) => {
  logger.debug("User ID in getUserRide controller:", req.user.id);
  const responseData = await RideService.getUserRide(req.user.id);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,

    message: "All Rides of User ",

    data: responseData,
  });
};
