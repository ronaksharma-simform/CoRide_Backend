import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/constants/errorCodes";
import { User } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import generateHash, { generateHashToken } from "@/utils/hash";
import { generateToken } from "@/utils/jwt.utils";
import { TUser } from "@/validations/user.validation";
import { v4 as uuidv4 } from "uuid";

export class AuthService {
  static register = async (
    userRegistrationData: TUser,
  ): Promise<{ userData: User; accessToken: string }> => {
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
    const refreshToken = generateToken({ id: generateUserId }, "refresh");
    const accessToken = generateToken({ id: generateUserId }, "access");
    const user = await prisma.user.create({
      data: {
        id: generateUserId,
        username: userRegistrationData.username,
        first_name: userRegistrationData.first_name,
        last_name: userRegistrationData.last_name,
        middle_name: userRegistrationData.middle_name,
        email: userRegistrationData.email,
        phone: userRegistrationData.phone,
        password: hashedPassword,
        org_name: userRegistrationData.org_name,
        role: userRegistrationData.role,
        gender: userRegistrationData.gender,
        refreshToken: refreshToken.token,
      },
    });
    return { userData: user, accessToken: accessToken.token };
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
