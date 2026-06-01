import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  registration,
  resendVerificationEmail,
  verifyEmail,
} from "@/controllers/auth.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import validateSchema from "@/middlewares/schema.middleware";
import {
  ResendVerifyEmailSchema,
  UserLoginSchema,
  UserRegistrationSchema,
} from "@/validations/user.validation";
const route = Router();

route.post(
  "/register",
  validateSchema(UserRegistrationSchema, "body"),
  asyncHandler(registration),
);
route.get("/verify-email", asyncHandler(verifyEmail));
route.post(
  "/login",
  asyncHandler(validateSchema(UserLoginSchema, "body")),
  asyncHandler(login),
);
route.post("/refresh-token", asyncHandler(refreshToken));
route.post("/logout", asyncHandler(logout));
route.post(
  "/resend-verify-email",
  asyncHandler(validateSchema(ResendVerifyEmailSchema, "body")),
  asyncHandler(resendVerificationEmail),
);
export default route;
