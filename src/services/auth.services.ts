import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/constants/errorCodes";
import { User } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import generateHash, { generateHashToken } from "@/utils/hash";
import { decodeToken, generateToken, TokenType } from "@/utils/jwt.utils";
import { TUser, TUserLoginSchema } from "@/validations/user.validation";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { config } from "@/utils/config";
import { logger } from "@/utils/logger";

export class AuthService {
  static readonly registerUser = async (
    userRegistrationData: TUser,
  ): Promise<{ userData: User }> => {
    const userWithExistingEmailOrPhone = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userRegistrationData.email },
          { phone: userRegistrationData.phone },
        ],
      },
    });
    if (userWithExistingEmailOrPhone) {
      throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS);
    }
    const hashedPassword = await generateHash(userRegistrationData.password);
    const generateUserId = uuidv4();
    const refreshToken = generateToken(
      { id: generateUserId },
      TokenType.REFRESH,
    );
    const user = await prisma.user.create({
      data: {
        id: generateUserId,
        username: userRegistrationData.username,
        firstName: userRegistrationData.firstName,
        lastName: userRegistrationData.lastName,
        middleName: userRegistrationData.middleName,
        email: userRegistrationData.email,
        phone: userRegistrationData.phone,
        password: hashedPassword,
        orgName: userRegistrationData.orgName,
        gender: userRegistrationData.gender,
        role: "USER",
        isIdVerified: false,
        refreshToken: refreshToken.token,
      },
    });
    return { userData: user };
  };

  static readonly generateVerficationToken = async (
    userId: string,
  ): Promise<string> => {
    const verificationToken = generateHashToken();
    await prisma.verificationToken.create({
      data: {
        id: uuidv4(),
        userId: userId,
        token: verificationToken.hashedToken,
        expiresAt: new Date(
          Date.now() + config.jwt.verification.expiry * 60 * 1000,
        ),
      },
    });
    return verificationToken.hashedToken;
  };
  static readonly verifyEmail = async (token: string): Promise<void> => {
    const data = await prisma.verificationToken.findFirst({
      where: { token },
    });
    if (!data) {
      throw new AppError("INVALID_VERIFICATION_TOKEN");
    }
    if (!data.expiresAt || data.expiresAt < new Date()) {
      throw new AppError("INVALID_VERIFICATION_TOKEN");
    }
    await prisma.user.update({
      where: { id: data.userId },
      data: { isIdVerified: true },
    });
  };
  static readonly loginUser = async (
    userLoginData: TUserLoginSchema,
  ): Promise<{ accessToken: string; userData: User }> => {
    const userWithEmail = await prisma.user.findUnique({
      where: { email: userLoginData.email },
    });
    if (!userWithEmail) {
      throw new AppError("AUTH_USER_NOT_FOUND");
    }
    const isPasswordValid = await bcrypt.compare(
      userLoginData.password,
      userWithEmail.password,
    );
    if (!isPasswordValid) {
      logger.debug("Invalid password for user: " + userWithEmail.email);
      throw new AppError("AUTH_INVALID_CREDENTIALS");
    }

    if (!userWithEmail.isIdVerified) {
      throw new AppError("AUTH_ACCOUNT_NOT_VERIFIED");
    }
    const accessToken = generateToken(
      { id: userWithEmail.id },
      TokenType.ACCESS,
    );
    if (userWithEmail.refreshToken === "") {
      const refreshToken = generateToken(
        { id: userWithEmail.id },
        TokenType.REFRESH,
      );
      await prisma.user.update({
        where: { id: userWithEmail.id },
        data: { refreshToken: refreshToken.token },
      });
      userWithEmail.refreshToken = refreshToken.token;
    }
    return { accessToken: accessToken.token, userData: userWithEmail };
  };
  static readonly refreshToken = async (
    refreshToken: string,
  ): Promise<{ accessToken: string }> => {
    const decodedData = decodeToken(refreshToken, TokenType.REFRESH);
    const user = await prisma.user.findUnique({
      where: { id: decodedData.id },
    });
    if (user?.refreshToken !== refreshToken) {
      throw new AppError("AUTH_INVALID_TOKEN");
    }
    const newAccessToken = generateToken({ id: user.id }, TokenType.ACCESS);
    return { accessToken: newAccessToken.token };
  };
  static readonly logout = async (refreshToken: string): Promise<void> => {
    const decodedData = decodeToken(refreshToken, TokenType.REFRESH);
    const user = await prisma.user.findUnique({
      where: { id: decodedData.id },
    });
    if (user?.refreshToken !== refreshToken) {
      throw new AppError("AUTH_INVALID_TOKEN");
    }
    await prisma.user.update({
      where: { id: decodedData.id },
      data: { refreshToken: "" },
    });
  };
  static readonly findUserByEmail = async (email: string): Promise<User> => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("AUTH_USER_NOT_FOUND");
    }
    return user;
  };
}
