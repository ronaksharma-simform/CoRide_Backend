import { z } from "zod";
export const cooridinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const Ride = z.object({
  vehicleId: z.uuid("Vehicle Id is required"),
  sourceLabel: cooridinateSchema,
  destinationLabel: cooridinateSchema,
  route: z.array(cooridinateSchema),
  departureTime: z.coerce
    .date()
    .refine((date) => date > new Date(), "Departure must be in future"),
  totalSeats: z
    .int("Seat number must be a number")
    .min(1, "Seat Capacity must be at least 1")
    .max(10, "Seat capacity cannot exceed 10"),
  availableSeats: z
    .int("Seat number must be a number")
    .min(0, "Seat Capacity must be a positive number")
    .max(10, "Seat capacity cannot exceed 10"),
  status: z
    .enum(["ACTIVE", "FULL", "COMPLETED", "CANCELLED"])
    .default("ACTIVE"),
});
export const RideUpdateSchema = Ride.omit({
  vehicleId: true,
}).partial();
type TRideUpdateSchema = z.infer<typeof RideUpdateSchema>;
type TRide = z.infer<typeof Ride>;
export { TRide, TRideUpdateSchema };
