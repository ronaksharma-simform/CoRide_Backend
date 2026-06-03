import { z } from "zod";

export const cooridinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
type TRideDataSchema = {
  id: string;
  providerId: string;
  vehicleId: string;
  sourceLabel: { lat: number; lng: number };
  destinationLabel: { lat: number; lng: number };
  route: { lat: number; lng: number }[];
  departureTime: Date;
  totalSeats: number;
  availableSeats: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
export const Ride = z.object({
  vehicleId: z.string().uuid("Vehicle Id is required"), // Fixed: z.string().uuid()
  sourceLabel: cooridinateSchema,
  destinationLabel: cooridinateSchema,
  route: z.array(cooridinateSchema),

  // Dynamic date check that handles partial/optional updates correctly
  departureTime: z.coerce.date().superRefine((date, ctx) => {
    if (date <= new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure must be in the future",
      });
    }
  }),

  totalSeats: z
    .number() // Fixed: z.number().int()
    .int("Seat number must be an integer")
    .min(1, "Seat Capacity must be at least 1")
    .max(10, "Seat capacity cannot exceed 10"),

  availableSeats: z
    .number() // Fixed: z.number().int()
    .int("Seat number must be an integer")
    .min(0, "Seat Capacity must be a positive number")
    .max(10, "Seat capacity cannot exceed 10"),

  status: z
    .enum(["ACTIVE", "FULL", "COMPLETED", "CANCELLED"])
    .default("ACTIVE"),
});
export const RideUpdateData = Ride.omit({ vehicleId: true }).partial();

export const RideUpdateSchema = Ride.omit({ vehicleId: true }).partial();
type TRideUpdateSchema = z.infer<typeof RideUpdateSchema>;
type TRideUpdateData = z.infer<typeof RideUpdateData>;
type TRide = z.infer<typeof Ride>;
export { TRide, TRideUpdateSchema, TRideUpdateData, TRideDataSchema };
