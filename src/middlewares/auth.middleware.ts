import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/constants/errorCodes";
import AppError from "@/utils/customErrorClass";
import { decodeToken, TokenType } from "@/utils/jwt.utils";

import { NextFunction, Request, Response } from "express";

const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING);
  }

  // Extracting Token
  const token = authHeader.split(" ")[1];
  //  verify token
  const decodedData = decodeToken(token.trim(), TokenType.ACCESS);
  const userDetails = await prisma.user.findUnique({
    where: {
      id: decodedData.id,
    },
  });
  if (!userDetails) {
    throw new AppError(ERROR_CODES.AUTH_USER_NOT_FOUND);
  }
  req.user = userDetails;
  next();
};

export default authMiddleware;
