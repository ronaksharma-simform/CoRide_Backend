import { z } from "zod";

export const CreatePayment = z.object({
  rideId: z.uuid("Ride id is required"),
});
export const RefundPayment = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(500),
});
export const PaymentIdParam = z.object({
  id: z.uuid("Payment id is required"),
});
