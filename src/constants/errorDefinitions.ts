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
    message: "Authentication required to access this resource",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_EMAIL_REQUIRED: {
    message: "Email address is required",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  AUTH_PASSWORD_REQUIRED: {
    message: "Password is required",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  AUTH_INVALID_EMAIL: {
    message: "Invalid email address format",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  AUTH_WEAK_PASSWORD: {
    message:
      "Password must contain uppercase, lowercase, numeric, and special characters",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  AUTH_PASSWORD_MISMATCH: {
    message: "Password confirmation does not match",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  AUTH_TOKEN_MISSING: {
    message: "Authorization token is missing",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_INVALID_TOKEN: {
    message: "Authorization token is invalid or expired",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_USER_NOT_FOUND: {
    message: "User not found",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_INVALID_PASSWORD: {
    message: "Invalid password",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_ACCOUNT_NOT_VERIFIED: {
    message: "Account not verified",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_ACCOUNT_LOCKED: {
    message: "Account is locked",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  AUTH_TOO_MANY_ATTEMPTS: {
    message: "Too many failed login attempts",
    statusCode: HTTP_STATUS_CODES.UNAUTHORIZED,
  },

  // 👤 USER
  USER_ALREADY_EXISTS: {
    message: "User account already exists",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },

  USERNAME_TAKEN: {
    message: "Username is already in use",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },

  // 📦 VALIDATION
  VALIDATION_FAILED: {
    message: "Request validation failed",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  INVALID_INPUT: {
    message: "Invalid input data provided",
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
    message: "Verification token is invalid",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  // 📧 EMAIL / OTP
  EMAIL_SEND_FAILED: {
    message: "Failed to dispatch email",
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  },

  OTP_EXPIRED: {
    message: "OTP has expired",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  OTP_INVALID: {
    message: "Invalid OTP provided",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  // ⚙️ SYSTEM
  INTERNAL_SERVER_ERROR: {
    message: "An unexpected server error occurred",
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  },

  DATABASE_ERROR: {
    message: "Database operation failed",
    statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  },
};
