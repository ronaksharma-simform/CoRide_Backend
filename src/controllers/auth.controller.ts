import { ERROR_CODES } from "@/constants/errorCodes";
// import { AuthService } from "@/services/auth.services";
import AppError from "@/utils/customErrorClass";
import User from "@/validations/user.validation";
import { RequestHandler } from "express";

export const registration: RequestHandler = async (req, res) => {
  const requestBody = await req.body;
  if (!requestBody) {
    throw new AppError(ERROR_CODES.INVALID_INPUT);
  }
  const result = User.safeParse(requestBody);
  if (!result.success) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED);
  }
  // const responseData = AuthService.register(result.data);
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    // data: ,
    accessToken: accessToken.accessToken,
  });
};
