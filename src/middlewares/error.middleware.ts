import CustomError from "@/utils/customErrorClass";
import { ErrorRequestHandler } from "express";
const errorMiddleware: ErrorRequestHandler = (
  error: CustomError,
  req,
  res,
  next,
) => {
  console.log(error.stack);

  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong";

  res.status(statusCode).json({
    success: false,
    message: message,
  });
  next();
};
export default errorMiddleware;
