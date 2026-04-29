import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import CustomError from "@/utils/customErrorClass";
import { ErrorRequestHandler } from "express";
const errorMiddleware: ErrorRequestHandler = (
  error: CustomError,
  req,
  res,
  next,
) => {
  console.error(error.stack);

  const statusCode =
    error.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  const message = error.message || "INTERNAL SERVER ERROR";

  res.status(statusCode).json({
    success: false,
    message: message,
  });
  next();
};
export default errorMiddleware;
