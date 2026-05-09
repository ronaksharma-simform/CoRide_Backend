import { User } from "@/generated/prisma/client";
import { AuthService } from "@/services/auth.services";
import MailService from "@/services/mail.services";
import { verificationTemplate } from "@/templates/verification.template";
import { config } from "@/utils/config";
import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import {
  TUserResponseSchema,
  UserResponseSchema,
} from "@/validations/user.validation";
import { RequestHandler } from "express";

const toUserResponse = (user: User): TUserResponseSchema => {
  return UserResponseSchema.parse({
    username: user.username,
    first_name: user.first_name,
    middle_name: user.middle_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    gender: user.gender,
    avg_rating: user.avg_rating,
    total_rides: user.total_rides,
    created_at: user.created_at,
  });
};
export const registration: RequestHandler = async (req, res) => {
  const responseData = await AuthService.registerUser(req.body);
  const verificationToken = await AuthService.generateVerficationToken(
    responseData.userData.id,
  );
  const verificationURL = config.jwt.verification.baseUrl + verificationToken;
  logger.debug(verificationURL);
  await MailService.sendMail(
    responseData.userData.email,
    "Email Verification",
    verificationTemplate(responseData.userData.username, verificationURL),
  );
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: toUserResponse(responseData.userData),
  });
};

export const verifyEmail: RequestHandler = async (req, res) => {
  const { token } = req.query;
  if (!token && typeof token !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Verification token is required" });
  }
  await AuthService.verifyEmail(token as string);
  return res
    .status(200)
    .json({ success: true, message: "Email verified successfully" });
};

export const login: RequestHandler = async (req, res) => {
  const responseData = await AuthService.loginUser(req.body);
  res.cookie("refreshToken", responseData.userData.refreshToken);
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: toUserResponse(responseData.userData),
    accessToken: responseData.accessToken,
  });
};
export const refreshToken: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError("AUTH_TOKEN_MISSING");
  }
  const newAccessToken = await AuthService.refreshToken(refreshToken);
  res.status(200).json({
    success: true,
    message: "Access token refreshed successfully",
    accessToken: newAccessToken,
  });
};

export const logout: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError("AUTH_TOKEN_MISSING");
  }
  await AuthService.logout(refreshToken);
  res.clearCookie("refreshToken");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
