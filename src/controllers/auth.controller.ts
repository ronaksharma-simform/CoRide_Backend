import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/errors/errorCodes";
import AppError from "@/utils/customErrorClass";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@/utils/generateToken";
import generateHash from "@/utils/hash";
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
  const userWithExistingEmail = await prisma.user.findUnique({
    where: { email: result.data.email },
  });
  const userWithExistingPhone = await prisma.user.findUnique({
    where: { phone: result.data.phone },
  });
  if (userWithExistingEmail || userWithExistingPhone) {
    throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS);
  }
  const hashedPassword = await generateHash(result.data.password);
  console.log("Hashed Password:", hashedPassword);
  const user = await prisma.user.create({
    data: {
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone,
      password: hashedPassword,
      org_name: result.data.org_name,
      role: result.data.role,
      gender: result.data.gender,
    },
  });
  const refreshToken = generateRefreshToken({ id: user.id });
  const accessToken = generateAccessToken({ id: user.id });
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: refreshToken.refreshToken },
  });
  user.refreshToken = refreshToken.refreshToken;
  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user },
    accessToken: accessToken.accessToken,
  });
};
