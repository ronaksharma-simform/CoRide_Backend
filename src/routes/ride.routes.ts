import { deleteRide, registerRide } from "@/controllers/ride.controller";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import { Ride } from "@/validations/ride.validations";
import { Router } from "express";

const router = Router();
router.post("/", validateSchema(Ride), asyncHandler(registerRide));
router.delete("/", validateSchema(IdSchema), asyncHandler(deleteRide));

export default router;
