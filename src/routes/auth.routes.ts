import { Router } from "express";
import {
  login,
  registration,
  verifyEmail,
} from "@/controllers/auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import validateSchema from "@/middlewares/schema.middleware";
import {
  UserLoginSchema,
  UserRegistrationSchema,
} from "@/validations/user.validation";
const route = Router();

route.post(
  "/register",
  validateSchema(UserRegistrationSchema),
  asyncHandler(registration),
);
route.get("/verify-email", asyncHandler(verifyEmail));
route.post("/login", validateSchema(UserLoginSchema), asyncHandler(login));
export default route;
