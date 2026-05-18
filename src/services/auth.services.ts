import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/constants/errorCodes";
import { User } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import generateHash, { generateHashToken } from "@/utils/hash";
import { generateToken, TokenType } from "@/utils/jwt.utils";
import { TUser } from "@/validations/user.validation";
import { v4 as uuidv4 } from "uuid";
export class AuthService {
  static registerUser = async (
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
        role: userRegistrationData.role,
        gender: userRegistrationData.gender,
        refreshToken: refreshToken.token,
      },
    });
    return { userData: user };
  };

  static generateVerficationToken = async (userId: string): Promise<string> => {
    const verificationToken = generateHashToken();
    await prisma.verificationToken.create({
      data: {
        id: uuidv4(),
        userId: userId,
        token: verificationToken.hashedToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    return verificationToken.hashedToken;
  };
  static verifyEmail = async (token: string): Promise<void> => {
    const data = await prisma.verificationToken.findFirst({
      where: { token: token },
    });
    if (!data) {
      throw new AppError("INVALID_VERIFICATION_TOKEN");
    }
    if (!data.expiresAt || data.expiresAt < new Date()) {
      throw new AppError("INVALID_VERIFICATION_TOKEN");
    }
    await prisma.user.update({
      where: {
        id: data.userId,
      },
      data: {
        is_id_verified: true,
      },
    });
  };
}
