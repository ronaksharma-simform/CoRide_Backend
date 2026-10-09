import {
  deleteRide,
  getRideData,
  getUserData,
  registerRide,
  updateRide,
} from "@/controllers/ride.controller";
import { requireRole } from "@/middlewares/role.middleware";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import { Ride, RideUpdateData } from "@/validations/ride.validations";
import { Router } from "express";

const router = Router();
const driverOnly = requireRole("DRIVER");
router.post("/", driverOnly, validateSchema(Ride), asyncHandler(registerRide));
router.delete(
  "/",
  driverOnly,
  validateSchema(IdSchema),
  asyncHandler(deleteRide),
);
router.put(
  "/",
  driverOnly,
  validateSchema(RideUpdateData),
  asyncHandler(updateRide),
);
router.get("/", validateSchema(IdSchema), asyncHandler(getRideData));
router.get("/user", asyncHandler(getUserData));
export default router;
