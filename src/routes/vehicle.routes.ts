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
  validateSchema(VehicleRegisterSchema),
  asyncHandler(registerVehicle),
);
route.delete("/", validateSchema(IdSchema), asyncHandler(deleteVehicle));
route.get("/vehicle", validateSchema(IdSchema), asyncHandler(getVehicle));
route.get("/vehicles", asyncHandler(getUserVehicles));
export default route;
