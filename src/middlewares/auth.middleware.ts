import { prisma } from "@/config/prisma";
import { ERROR_CODES } from "@/errors/errorCodes";
import { asyncHandler } from "@/utils/asyncHandler";
import AppError from "@/utils/customErrorClass";
import decodeToken from "@/utils/decodeToken";
import { NextFunction, Request, Response } from "express";

const authMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING);
    }

    // Extracting Token
    const token = authHeader.split(" ")[1];
    console.log(token);
    //  verify token
    const decodedData = decodeToken(token.trim(), "Access_Token");
    const userDetails = await prisma.user.findUnique({
      where: {
        id: decodedData.id,
      },
    });
    // Attaching User details
    req.user = userDetails;
    console.log(userDetails);
    next();
  },
);

export default authMiddleware;
