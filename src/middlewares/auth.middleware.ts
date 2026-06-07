import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/constants/errorCodes";
import AppError from "@/utils/customErrorClass";
import { decodeToken, TokenType } from "@/utils/jwt.utils";
import { logger } from "@/utils/logger";

import { NextFunction, Request, Response } from "express";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = req.cookies?.accessToken;
  // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk3YzFlNGUzLTdhNGEtNGZkZS1hODc3LTljNDdjODNlODg3NCIsImlhdCI6MTc4MDczNTAwMCwiZXhwIjoxNzgzMzI3MDAwfQ.Wugf3sC6y-L08a2FRAx2ao_KGeiUFvQ08HFfQig8PIU"
  // logger.info("Access token from cookies:", token);
  // logger.info(req.cookies);
  if (!token) {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING);
  }
  const decodedData = decodeToken(token.trim(), TokenType.ACCESS);
  const userDetails = await prisma.user.findUnique({
    where: {
      id: decodedData.id,
    },
  });
  req.user = userDetails;
  logger.info("User details attached to request object:", req.user);
  next();
};

export default authMiddleware;
