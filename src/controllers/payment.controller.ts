import { HTTP_STATUS_CODES } from "@/constants/httpCodes";
import { PaymentService } from "@/services/payment.services";
import { RequestHandler } from "express";

export const createPayment: RequestHandler = async (req, res) => {
  const data = await PaymentService.createPayment(req.body.rideId, req.user);
  res.status(HTTP_STATUS_CODES.CREATED).json({
    success: true,
    message: "Payment created",
    data,
  });
};
export const confirmPayment: RequestHandler = async (req, res) => {
  const data = await PaymentService.confirmPayment(
    String(req.params.id),
    req.user,
  );
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: `Payment ${data.status.toLowerCase()}`,
    data,
  });
};
export const refundPayment: RequestHandler = async (req, res) => {
  const data = await PaymentService.refundPayment(
    String(req.params.id),
    req.body.reason,
  );
  res.status(HTTP_STATUS_CODES.OK).json({
    success: true,
    message: "Payment refunded",
    data,
  });
};
export const getPayment: RequestHandler = async (req, res) => {
  const data = await PaymentService.getPayment(String(req.params.id), req.user);
  res.status(HTTP_STATUS_CODES.OK).json({ success: true, data });
};
export const listPayments: RequestHandler = async (req, res) => {
  const data = await PaymentService.listPayments(req.user);
  res.status(HTTP_STATUS_CODES.OK).json({ success: true, data });
};
