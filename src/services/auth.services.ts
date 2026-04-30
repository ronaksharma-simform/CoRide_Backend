import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/constants/errorCodes";
import { User } from "@/generated/prisma/client";
import AppError from "@/utils/customErrorClass";
import generateHash from "@/utils/hash";
import { generateToken } from "@/utils/jwt.utils";
import { v4 as uuidv4 } from "uuid";
export class AuthService {
  static register = async (
    userRegistrationData: User,
  ): Promise<{ userData: User; accessToken: string }> => {
    const userWithExistingEmail = await prisma.user.findUnique({
      where: { email: userRegistrationData.email },
    });
    if (userWithExistingEmail) {
      throw new AppError(ERROR_CODES.USER_ALREADY_EXISTS);
    }
    const userWithExistingPhone = await prisma.user.findUnique({
      where: { phone: userRegistrationData.phone },
    });
    if (userWithExistingPhone) {
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
    user.refreshToken = refreshToken.token;
    return {
      userData: user,
      accessToken: accessToken.token,
    };
  };
}
