import CustomError from "@/utils/customErrorClass";
import { ErrorRequestHandler } from "express";
const errorMiddleware: ErrorRequestHandler = (
  error: CustomError,
  req,
  res,
  next,
) => {
  console.log(error.stack);

  res.status(error.statusCode).json({
    success: false,
    message: error.message || "Something went wrong",
  });
  next();
};
export default errorMiddleware;
