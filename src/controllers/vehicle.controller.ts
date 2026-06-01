import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import { VehicleService } from "@/services/vehicle.services";
import { RequestHandler } from "express";

export const registerVehicle: RequestHandler = async (req, res) => {
  const responseData = await VehicleService.registerVehicle(
    req.body,
    req.user?.id,
  );
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "Vehicle Registered Sucessfully",
    data: responseData,
  });
};
export const deleteVehicle: RequestHandler = async (req, res) => {
  const responseData = await VehicleService.deleteVehicle(
    req.params.id as string,
  );
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Vehicle Deleted Sucessfully",
    data: responseData,
  });
};
export const getVehicle: RequestHandler = async (req, res) => {
  const responseData = await VehicleService.getVehicleById(
    req.query.id as string,
  );
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Vehicle data",
    data: responseData,
  });
};
export const getUserVehicles: RequestHandler = async (req, res) => {
  const responseData = await VehicleService.getUserVehicles(req.user?.id);
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "All vehicles data of User",
    data: responseData,
  });
};
