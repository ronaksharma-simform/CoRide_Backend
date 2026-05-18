import { Router } from "express";
import { registration, verifyEmail } from "@/controllers/auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import validateSchema from "@/middlewares/schema.middleware";
import { UserRegistrationSchema } from "@/validations/user.validation";
const route = Router();

route.post(
  "/register",
  validateSchema(UserRegistrationSchema),
  asyncHandler(registration),
);
route.get("/verify-email", asyncHandler(verifyEmail));
export default route;
