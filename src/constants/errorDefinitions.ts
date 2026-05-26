import { ERROR_CODES } from "../constants/errorCodes";
import { HTTP_STATUS_CODES } from "./httpCodes";

type ErrorDefinition = { message: string; statusCode: number };

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

  AUTH_INVALID_CREDENTIALS: {
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
  // 🚗 VEHICLE
  VEHICLE_PLATE_ALREADY_REGISTERED: {
    message: "A vehicle with this license plate number is already registered",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },

  VEHICLE_NOT_FOUND: {
    message: "The requested vehicle could not be found",
    statusCode: HTTP_STATUS_CODES.NOT_FOUND,
  },

  VEHICLE_INVALID_PLATE_FORMAT: {
    message: "License plate number format is invalid",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  VEHICLE_YEAR_OUT_OF_RANGE: {
    message: "Vehicle year does not meet platform requirements",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  VEHICLE_INVALID_CAPACITY: {
    message: "Seat capacity must be within allowed limits (e.g., 1 to 8 seats)",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
  // 🚘 RIDE
  RIDE_NOT_FOUND: {
    message: "Ride not found",
    statusCode: HTTP_STATUS_CODES.NOT_FOUND,
  },

  RIDE_ALREADY_STARTED: {
    message: "Ride has already started",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_ALREADY_COMPLETED: {
    message: "Ride is already completed",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_ALREADY_CANCELLED: {
    message: "Ride has already been cancelled",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_SEATS_NOT_AVAILABLE: {
    message: "Requested seats are not available",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_INVALID_ROUTE: {
    message: "Invalid pickup or destination route",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_INVALID_TIME: {
    message: "Invalid departure time provided",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_PAST_DEPARTURE_TIME: {
    message: "Departure time cannot be in the past",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_DRIVER_VEHICLE_REQUIRED: {
    message: "Driver must register a vehicle before creating a ride",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_PICKUP_REQUIRED: {
    message: "Pickup location is required",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_DESTINATION_REQUIRED: {
    message: "Destination location is required",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_CANNOT_JOIN_OWN_RIDE: {
    message: "You cannot join your own ride",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_ALREADY_JOINED: {
    message: "You have already joined this ride",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },

  RIDE_MAX_CAPACITY_REACHED: {
    message: "Ride has reached maximum seat capacity",
    statusCode: HTTP_STATUS_CODES.CONFLICT,
  },

  RIDE_INVALID_FARE: {
    message: "Ride fare amount is invalid",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },

  RIDE_UNAUTHORIZED_ACTION: {
    message: "You are not allowed to perform this ride action",
    statusCode: HTTP_STATUS_CODES.FORBIDDEN,
  },
  RIDE_NO_DATA_TO_UPDATE: {
    message: "No data given to update ride",
    statusCode: HTTP_STATUS_CODES.BAD_REQUEST,
  },
};
