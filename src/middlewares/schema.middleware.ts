import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import { NextFunction, RequestHandler, Request, Response } from "express";
import { ZodError, ZodObject } from "zod";

const validateSchema =
  (schema: ZodObject, type: "body" | "query" | "params"): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.debug(typeof req.params);
      const bodyData = await schema.parseAsync(req[type]);
      logger.debug(bodyData);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            "VALIDATION_FAILED",
            "Request validation failed",
            error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          ),
        );
      }
      next(error);
    }
  };
export default validateSchema;
