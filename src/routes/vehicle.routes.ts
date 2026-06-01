import {
  deleteVehicle,
  getUserVehicles,
  getVehicle,
  registerVehicle,
} from "@/controllers/vehicle.controller";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import { VehicleRegisterSchema } from "@/validations/vehicle.validations";
import { Router } from "express";
const route = Router();

route.post(
  "/",
  validateSchema(VehicleRegisterSchema, "body"),
  asyncHandler(registerVehicle),
);
route.delete(
  "/:id",
  validateSchema(IdSchema, "params"),
  asyncHandler(deleteVehicle),
);
route.get(
  "/vehicle/:id",
  validateSchema(IdSchema, "params"),
  asyncHandler(getVehicle),
);
route.get("/vehicles", asyncHandler(getUserVehicles));
export default route;
