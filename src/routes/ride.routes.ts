import {
  deleteRide,
  getRideData,
  getUserRide,
  registerRide,
  updateRide,
} from "@/controllers/ride.controller";

import validateSchema from "@/middlewares/schema.middleware";

import { asyncHandler } from "@/utils/asyncHandler";

import { IdSchema } from "@/validations/common.validations";

import { Ride, RideUpdateData } from "@/validations/ride.validations";

import { Router } from "express";

const router = Router();

router.post("/", validateSchema(Ride, "body"), asyncHandler(registerRide));

router.delete(
  "/:id",
  validateSchema(IdSchema, "params"),
  asyncHandler(deleteRide),
);

router.put(
  "/:id",
  validateSchema(RideUpdateData, "body"),
  validateSchema(IdSchema, "params"),
  asyncHandler(updateRide),
);

router.get("/user", asyncHandler(getUserRide));
router.get(
  "/:id",
  validateSchema(IdSchema, "params"),
  asyncHandler(getRideData),
);

export default router;
