import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
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
import ms from "ms";

const toUserResponse = (user: User): TUserResponseSchema => {
  return UserResponseSchema.parse({
    username: user.username,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    gender: user.gender,
    avg_rating: user.avgRating,
    total_rides: user.totalRides,
    created_at: user.createdAt,
  });
};
export const registration: RequestHandler = async (req, res) => {
  const responseData = await AuthService.registerUser(req.body);
  const verificationToken = await AuthService.generateVerficationToken(
    responseData.userData.id,
  );
  const verificationURL = config.jwt.verification.baseUrl + verificationToken;
  await MailService.sendMail(
    responseData.userData.email,
    "Email Verification",
    verificationTemplate(responseData.userData.username, verificationURL),
  );
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "User registered successfully",
    data: toUserResponse(responseData.userData),
  });
};

export const verifyEmail: RequestHandler = async (req, res) => {
  const { token } = req.query;
  if (!token && typeof token !== "string") {
    return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: "Verification token is required",
    });
  }
  await AuthService.verifyEmail(token as string);
  return res
    .status(HTTP_STATUS_CODES.OK)
    .json({ success: true, message: "Email verified successfully" });
};

export const login: RequestHandler = async (req, res) => {
  const responseData = await AuthService.loginUser(req.body);
  logger.info("Login successful, preparing to set cookies and send response");
  logger.info(responseData.userData.refreshToken.length);
  logger.info(responseData.accessToken.length);
  res.cookie("refreshToken", responseData.userData.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.app.env === "production",
    expires: new Date(Date.now() + ms(config.jwt.refresh.expiry)),
  });

  res.cookie("accessToken", responseData.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.app.env === "production",
    expires: new Date(Date.now() + ms(config.jwt.access.expiry)),
  });

  res.status(HTTP_STATUS_CODES.OK).json({
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
  res.status(HTTP_STATUS_CODES.OK).json({
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
  res.clearCookie("accessToken");
  res
    .status(HTTP_STATUS_CODES.OK)
    .json({ success: true, message: "Logged out successfully" });
};
export const resendVerificationEmail: RequestHandler = async (req, res) => {
  const { email } = req.body;
  const user = await AuthService.findUserByEmail(email);
  const verificationToken = await AuthService.generateVerficationToken(user.id);
  const verificationURL = config.jwt.verification.baseUrl + verificationToken;
  await MailService.sendMail(
    user.email,
    "Email Verification",
    verificationTemplate(user.username, verificationURL),
  );
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Email Send Sucessfully",
  });
};
