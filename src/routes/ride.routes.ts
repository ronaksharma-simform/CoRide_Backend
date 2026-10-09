import {
  deleteRide,
  getRideData,
  getUserData,
  registerRide,
  updateRide,
} from "@/controllers/ride.controller";
import {
  completeRide,
  getRideStatus,
  recordLocation,
  startRide,
} from "@/controllers/tracking.controller";
import { requireRole } from "@/middlewares/role.middleware";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import { LocationSchema } from "@/validations/tracking.validations";
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
router.post("/:id/start", driverOnly, asyncHandler(startRide));
router.post("/:id/complete", driverOnly, asyncHandler(completeRide));
router.post(
  "/:id/location",
  driverOnly,
  validateSchema(LocationSchema),
  asyncHandler(recordLocation),
);
router.get("/:id/status", asyncHandler(getRideStatus));
export default router;
