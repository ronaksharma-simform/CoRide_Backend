import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import { RideService } from "@/services/ride.services";
import AppError from "@/utils/customErrorClass";
import { RequestHandler } from "express";
import { z } from "zod";

const parseRideId = (rideId: unknown): string => {
  const parsed = z.string().uuid().safeParse(rideId);
  if (!parsed.success) {
    throw new AppError("VALIDATION_FAILED", "Invalid ride id in request");
  }
  return parsed.data;
};

export const registerRide: RequestHandler = async (req, res) => {
  const responseData = await RideService.createRide(req.body, req.user.id);
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "Ride created sucessfully",
    data: responseData,
  });
};
export const deleteRide: RequestHandler = async (req, res) => {
  await RideService.deleteRide(req.body.id);
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Ride Deleted sucessfully",
  });
};
export const updateRide: RequestHandler = async (req, res) => {
  const responseData = await RideService.updateRide(req.body.data, req.body.id);
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Ride Updated sucessfully",
    data: responseData,
  });
};
export const getRideData: RequestHandler = async (req, res) => {
  const responseData = await RideService.getRideData(req.body.id);
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
export const getAvailableRides: RequestHandler = async (req, res) => {
  const responseData = await RideService.getAvailableRides(req.user.id);
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Available rides fetched sucessfully",
    data: responseData,
  });
};
export const getRideSeatLayout: RequestHandler = async (req, res) => {
  const rideId = parseRideId(req.params.rideId);
  const responseData = await RideService.getRideSeatLayout(rideId, req.user.id);
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Ride seat layout fetched sucessfully",
    data: responseData,
  });
};
export const bookSeat: RequestHandler = async (req, res) => {
  const rideId = parseRideId(req.params.rideId);
  const responseData = await RideService.bookSeat(
    rideId,
    req.user.id,
    req.body.seatNumber,
  );
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "Seat booked sucessfully",
    data: responseData,
  });
};
