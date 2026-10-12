import {
  acceptMatch,
  cancelMatch,
  rejectMatch,
  requestMatch,
} from "@/controllers/match.controller";
import { requireRole } from "@/middlewares/role.middleware";
import validateSchema from "@/middlewares/schema.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { IdSchema } from "@/validations/common.validations";
import { MatchRequestSchema } from "@/validations/match.validations";
import { Router } from "express";

const router = Router();
const riderOnly = requireRole("RIDER");
const driverOnly = requireRole("DRIVER");
router.post(
  "/",
  riderOnly,
  validateSchema(MatchRequestSchema),
  asyncHandler(requestMatch),
);
router.post(
  "/accept",
  driverOnly,
  validateSchema(IdSchema),
  asyncHandler(acceptMatch),
);
router.post(
  "/reject",
  driverOnly,
  validateSchema(IdSchema),
  asyncHandler(rejectMatch),
);
router.post(
  "/cancel",
  riderOnly,
  validateSchema(IdSchema),
  asyncHandler(cancelMatch),
);
export default router;
