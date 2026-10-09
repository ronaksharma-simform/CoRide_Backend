import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import { RideStatus } from "@/generated/prisma/client";
import { TrackingService } from "@/services/tracking.services";
import AppError from "@/utils/customErrorClass";
import { IdSchema } from "@/validations/common.validations";
import { RequestHandler } from "express";

const rideId = (params: unknown): string => {
  const parsed = IdSchema.safeParse(params);
  if (!parsed.success)
    throw new AppError("VALIDATION_FAILED", "Invalid ride id");
  return parsed.data.id;
};
const ok = (message: string, data: unknown): object => ({
  success: true,
  message,
  data,
});

const statusChange =
  (to: RideStatus): RequestHandler =>
  async (req, res) => {
    const data = await TrackingService.changeStatus(
      rideId(req.params),
      req.user.id,
      to,
    );
    res.status(HTTP_STATUS_CODES.OK).json(ok(`Ride ${to}`, data));
  };

export const startRide = statusChange("IN_PROGRESS");
export const completeRide = statusChange("COMPLETED");

export const recordLocation: RequestHandler = async (req, res) => {
  const data = await TrackingService.recordLocation(
    rideId(req.params),
    req.user.id,
    req.body,
  );
  res.status(HTTP_STATUS_CODES.CREATED).json(ok("Location recorded", data));
};

export const getRideStatus: RequestHandler = async (req, res) => {
  const data = await TrackingService.getStatus(rideId(req.params));
  res.status(HTTP_STATUS_CODES.OK).json(ok("Ride status", data));
};
