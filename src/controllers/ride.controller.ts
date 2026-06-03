import { HTTP_STATUS_CODES } from "@/constants/httpCodes";

import { RideService } from "@/services/ride.services";

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
  await RideService.deleteRide(req.params.id as string);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,

    message: "Ride Deleted sucessfully",
  });
};

export const updateRide: RequestHandler = async (req, res) => {
  const responseData = await RideService.updateRide(
    req.body.data,
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

export const getUserData: RequestHandler = async (req, res) => {
  const responseData = await RideService.getUserRide(req.user.id);

  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,

    message: "All Rides of User ",

    data: responseData,
  });
};
