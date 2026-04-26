import { ERROR_CODES } from "./errorCodes";

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
    statusCode: 401,
  },
  AUTH_EMAIL_REQUIRED: {
    message: "Email is required",
    statusCode: 400,
  },
  AUTH_PASSWORD_REQUIRED: {
    message: "Password is required",
    statusCode: 400,
  },
  AUTH_INVALID_EMAIL: {
    message: "Invalid email format",
    statusCode: 400,
  },
  AUTH_WEAK_PASSWORD: {
    message: "Password is too weak",
    statusCode: 400,
  },
  AUTH_PASSWORD_MISMATCH: {
    message: "Passwords do not match",
    statusCode: 400,
  },

  // 👤 USER
  USER_ALREADY_EXISTS: {
    message: "User already exists",
    statusCode: 409,
  },
  USERNAME_TAKEN: {
    message: "Username is already taken",
    statusCode: 409,
  },

  // 📦 VALIDATION
  VALIDATION_FAILED: {
    message: "Validation failed",
    statusCode: 400,
  },
  INVALID_INPUT: {
    message: "Invalid input provided",
    statusCode: 400,
  },
  MISSING_REQUIRED_FIELDS: {
    message: "Required fields are missing",
    statusCode: 400,
  },

  // 🔒 TOKEN / VERIFICATION
  TOKEN_EXPIRED: {
    message: "Token has expired",
    statusCode: 401,
  },
  INVALID_VERIFICATION_TOKEN: {
    message: "Invalid verification token",
    statusCode: 400,
  },

  // 📧 EMAIL / OTP
  EMAIL_SEND_FAILED: {
    message: "Failed to send email",
    statusCode: 500,
  },
  OTP_EXPIRED: {
    message: "OTP has expired",
    statusCode: 400,
  },
  OTP_INVALID: {
    message: "Invalid OTP",
    statusCode: 400,
  },

  // ⚙️ SYSTEM
  INTERNAL_SERVER_ERROR: {
    message: "Something went wrong",
    statusCode: 500,
  },
  DATABASE_ERROR: {
    message: "Database operation failed",
    statusCode: 500,
  },
};
