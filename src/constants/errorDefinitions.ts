import { ERROR_CODES } from "../constants/errorCodes";
import { HTTP_STATUS_CODES } from "./httpCodes";

type ErrorDefinition = {
  message: string;
  statusCode: number;
};

export const ERROR_MAP: Record<
  (typeof ERROR_CODES)[keyof typeof ERROR_CODES],
  ErrorDefinition
> = {
  // 🔐 AUTH
  AUTH_UNAUTHORIZED: {
    message: "Unauthorized",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },
  AUTH_EMAIL_REQUIRED: {
    message: "Email is required",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  AUTH_PASSWORD_REQUIRED: {
    message: "Password is required",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  AUTH_INVALID_EMAIL: {
    message: "Invalid email format",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  AUTH_WEAK_PASSWORD: {
    message: "Password is too weak",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  AUTH_PASSWORD_MISMATCH: {
    message: "Passwords do not match",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  AUTH_TOKEN_MISSING: {
    message: "Authorization token is missing",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },
  AUTH_INVALID_TOKEN: {
    message: "Invalid or expired token",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  USER_ALREADY_EXISTS: {
    message: "User already exists",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },
  USERNAME_TAKEN: {
    message: "Username is already taken",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },

  // 📦 VALIDATION
  VALIDATION_FAILED: {
    message: "Validation failed",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  INVALID_INPUT: {
    message: "Invalid input provided",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  MISSING_REQUIRED_FIELDS: {
    message: "Required fields are missing",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  // 🔒 TOKEN / VERIFICATION
  TOKEN_EXPIRED: {
    message: "Token has expired",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },
  INVALID_VERIFICATION_TOKEN: {
    message: "Invalid verification token",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  // 📧 EMAIL / OTP
  EMAIL_SEND_FAILED: {
    message: "Failed to send email",
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  },
  OTP_EXPIRED: {
    message: "OTP has expired",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  OTP_INVALID: {
    message: "Invalid OTP",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  // ⚙️ SYSTEM
  INTERNAL_SERVER_ERROR: {
    message: "Internal Server Error",
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  },
  DATABASE_ERROR: {
    message: "Database operation failed",
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  },
};
