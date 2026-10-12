import {
  confirmPayment,
  createPayment,
  getPayment,
  listPayments,
  refundPayment,
} from "@/controllers/payment.controller";
import { requireRole } from "@/middlewares/role.middleware";
import validateSchema from "@/middlewares/schema.middleware";
import AppError from "@/utils/customErrorClass";
import { asyncHandler } from "@/utils/asyncHandler";
import {
  CreatePayment,
  PaymentIdParam,
  RefundPayment,
} from "@/validations/payment.validations";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();
const riderOnly = requireRole("RIDER");
const adminOnly = requireRole("ADMIN");

const validateId = (req: Request, _res: Response, next: NextFunction): void => {
  if (PaymentIdParam.safeParse(req.params).success) return next();
  next(new AppError("VALIDATION_FAILED", "Payment id must be a valid id"));
};

router.post(
  "/",
  riderOnly,
  validateSchema(CreatePayment),
  asyncHandler(createPayment),
);
router.get("/", asyncHandler(listPayments));
router.get("/:id", validateId, asyncHandler(getPayment));
router.post(
  "/:id/confirm",
  riderOnly,
  validateId,
  asyncHandler(confirmPayment),
);
router.post(
  "/:id/refund",
  adminOnly,
  validateId,
  validateSchema(RefundPayment),
  asyncHandler(refundPayment),
);
export default router;
