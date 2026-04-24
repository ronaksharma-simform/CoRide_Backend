import jwt from "jsonwebtoken";
import CustomError from "./customErrorClass";

interface JwtPayload {
  id: string;
}

export default function decodeToken(
  token: string,
  type: "Access_Token" | "Refresh_Token",
): JwtPayload {
  if (!token || token.trim() === "") {
    throw new CustomError("Token is required", 401);
  }

  const secret =
    type === "Access_Token"
      ? process.env.ACCESS_TOKEN_SECRET
      : process.env.REFRESH_TOKEN_SECRET;

  if (!secret) {
    throw new CustomError("JWT secret not configured", 500);
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Type guard
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      return decoded as JwtPayload;
    }

    throw new CustomError("Invalid token payload", 401);
  } catch (err) {
    if (err instanceof Error) {
      throw new CustomError(err.message, 401);
    }
    throw new CustomError("Token verification failed", 401);
  }
}
