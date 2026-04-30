import jwt from "jsonwebtoken";
import AppError from "./customErrorClass";
import { ERROR_CODES } from "@/constants/errorCodes";

interface JwtPayload {
  id: string;
}

const decodeToken = (
  token: string,
  type: "Access_Token" | "Refresh_Token",
): JwtPayload => {
  if (!token || token.trim() === "") {
    throw new AppError(ERROR_CODES.AUTH_TOKEN_MISSING);
  }

  const secret =
    type === "Access_Token"
      ? process.env.ACCESS_TOKEN_SECRET
      : process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    throw new AppError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "JWT secret not configured",
    );
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Type guard
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      return decoded as JwtPayload;
    }

    throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
  } catch (err) {
    if (err instanceof Error) {
      throw new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR, err.message);
    }
    throw new AppError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Token verification failed",
    );
  }
};
export default decodeToken;
