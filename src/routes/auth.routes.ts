import { Router } from "express";
import { registration } from "@/controllers/auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import validateSchema from "@/middlewares/schema.middleware";
import { UserReqBodySchema } from "@/validations/user.validation";
const route = Router();

route.post(
  "/register",
  validateSchema(UserReqBodySchema),
  asyncHandler(registration),
);

export default route;
