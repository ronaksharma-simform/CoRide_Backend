import { registerRideRequest } from "@/controllers/rideRequest.controller";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { RideRequest } from "@/validations/rideRequest.validations";
import { Router } from "express";
const route = Router();
route.post("/", validateSchema(RideRequest), asyncHandler(registerRideRequest));
export default route;
