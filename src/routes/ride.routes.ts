import {
  deleteRide,
  registerRide,
  updateRide,
} from "@/controllers/ride.controller";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import { Ride, RideUpdateSchema } from "@/validations/ride.validations";
import { Router } from "express";

const router = Router();
router.post("/", validateSchema(Ride), asyncHandler(registerRide));
router.delete("/", validateSchema(IdSchema), asyncHandler(deleteRide));
router.put("/", validateSchema(RideUpdateSchema), asyncHandler(updateRide));
export default router;
