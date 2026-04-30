import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "./config";
import AppError from "./customErrorClass";
import { ERROR_CODES } from "@/constants/errorCodes";

export interface ITokenData {
  id: string;
}

interface TokenPayload {
  id: string;
}
export const generateToken = (
  data: ITokenData,
  type: "access" | "refresh",
): { token: string } => {
  const isAccess = type === "access";

  const secret = isAccess
    ? config.jwt.access.secret
    : config.jwt.refresh.secret;

  if (!secret) {
    throw new AppError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "JWT secret not configured",
    );
  }

  const expiresIn: SignOptions["expiresIn"] = isAccess
    ? config.jwt.access.expiry
    : config.jwt.refresh.expiry;

  const token = jwt.sign(data, secret, { expiresIn });

  return { token };
};

export const decodeToken = (
  token: string,
  type: "access" | "refresh",
): TokenPayload => {
  if (!token || token.trim() === "") {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING);
  }

  const secret =
    type === "access" ? config.jwt.access.secret : config.jwt.refresh.secret;

  if (!secret) {
    throw new AppError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "JWT secret not configured",
    );
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      return { id: decoded.id };
    }

    throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
  }
};
