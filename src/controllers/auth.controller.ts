import { AuthService } from "@/services/auth.services";
import MailService from "@/services/mail.services";
import { verificationTemplate } from "@/templates/verification.template";
import { config } from "@/utils/config";
import { logger } from "@/utils/logger";
import { RequestHandler } from "express";

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
    data: responseData.userData,
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
    data: responseData.userData,
    accessToken: responseData.accessToken,
  });
};
