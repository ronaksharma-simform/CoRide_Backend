import { ErrorCode } from "./errorCodes";

type ErrorDefinition = {
  message: string;
  statusCode: number;
};

export const ERROR_MAP: Record<ErrorCode, ErrorDefinition> = {
  AUTH_UNAUTHORIZED: {
    message: "Unauthorized",
    statusCode: 401,
  },
  AUTH_TOKEN_MISSING: {
    message: "Authorization token is missing",
    statusCode: 401,
  },
  AUTH_INVALID_TOKEN: {
    message: "Invalid or expired token",
    statusCode: 401,
  },

  USER_NOT_FOUND: {
    message: "User not found",
    statusCode: 404,
  },
  USER_ALREADY_EXISTS: {
    message: "User already exists",
    statusCode: 409,
  },

  INTERNAL_SERVER_ERROR: {
    message: "Something went wrong",
    statusCode: 500,
  },
};
