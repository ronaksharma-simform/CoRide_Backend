import { z } from "zod";

export const Vehicle = z.object({
  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(20, "Model name is too long"),
  company: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(20, "Company name is too long"),
  color: z
    .string()
    .trim()
    .min(2, "Color is required")
    .max(20, "Color name is too long"),
  plateNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/, "Invalid vehicle plate number"),
  userId: z.uuid("Invalid user id"),
  seatCapacity: z
    .int("Seat number must be a number")
    .min(1, "Seat Capacity must be at least 1")
    .max(10, "Seat capacity cannot exceed 10"),
});
export const VehicleRegisterSchema = Vehicle.pick({
  company: true,
  plateNumber: true,
  seatCapacity: true,
  color: true,
  model: true,
});

type TVehicleRegisterSchema = z.infer<typeof VehicleRegisterSchema>;
type TVehicle = z.infer<typeof Vehicle>;
export { TVehicle, TVehicleRegisterSchema };
