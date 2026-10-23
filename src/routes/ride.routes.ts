import {
  bookSeat,
  deleteRide,
  getAvailableRides,
  getRideData,
  getRideSeatLayout,
  getUserData,
  registerRide,
  updateRide,
} from "@/controllers/ride.controller";
import { requireRole } from "@/middlewares/role.middleware";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import {
  BookSeatSchema,
  Ride,
  RideUpdateData,
} from "@/validations/ride.validations";
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
router.get("/available", asyncHandler(getAvailableRides));
router.get("/:rideId/layout", asyncHandler(getRideSeatLayout));
router.post(
  "/:rideId/book-seat",
  validateSchema(BookSeatSchema),
  asyncHandler(bookSeat),
);
export default router;
