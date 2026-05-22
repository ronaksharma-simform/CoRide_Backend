import AppError from "@/utils/customErrorClass";
import { logger } from "@/utils/logger";
import { NextFunction, RequestHandler, Request, Response } from "express";
import { ZodError, ZodObject } from "zod";

const validateSchema =
  (schema: ZodObject): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.debug(req.body);
      const bodyData = await schema.parseAsync(req.body);
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
