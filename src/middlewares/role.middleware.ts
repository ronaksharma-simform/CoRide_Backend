import { ERROR_CODES } from "@/constants/errorCodes";
import AppError from "@/utils/customErrorClass";
import { NextFunction, Request, Response } from "express";

export type Role = "RIDER" | "DRIVER" | "ADMIN";

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(ERROR_CODES.AUTH_UNAUTHORIZED));
    }
    if (!roles.includes(req.user.role as Role)) {
      return next(new AppError(ERROR_CODES.AUTH_FORBIDDEN));
    }
    next();
  };
