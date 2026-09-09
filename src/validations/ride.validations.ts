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
export const RideUpdateData = z.object({
  id: z.string(),
  data: Ride.omit({ vehicleId: true }).partial(),
});
export const RideUpdateSchema = Ride.omit({ vehicleId: true }).partial();
type TRideUpdateSchema = z.infer<typeof RideUpdateSchema>;
type TRideUpdateData = z.infer<typeof RideUpdateData>;
type TRide = z.infer<typeof Ride>;
export const BookSeatSchema = z.object({
  seatNumber: z
    .number()
    .int("Seat number must be an integer")
    .min(1, "Seat number must be at least 1"),
});
type TBookSeatSchema = z.infer<typeof BookSeatSchema>;
type TRideSeatSchema = {
  seatNumber: number;
  kind: "driver" | "passenger";
  status: "driver" | "booked" | "available";
  bookedBy: { id: string; name: string } | null;
};
type TRideSeatLayoutSchema = {
  ride: {
    id: string;
    providerId: string;
    vehicleId: string;
    departureTime: Date;
    totalSeats: number;
    availableSeats: number;
    status: string;
  };
  vehicle: {
    id: string;
    company: string;
    model: string;
    color: string;
    plateNumber: string;
    seatCapacity: number;
  };
  seats: TRideSeatSchema[];
  myBooking: number | null;
};
type TRideProviderSchema = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  avgRating: number;
  totalRides: number;
};
type TRideVehicleSchema = {
  id: string;
  company: string;
  model: string;
  color: string;
  plateNumber: string;
  seatCapacity: number;
};
type TRideAvailableSchema = TRideDataSchema & {
  provider: TRideProviderSchema;
  vehicle: TRideVehicleSchema;
};
type TRideBookingDataSchema = {
  booking: {
    id: string;
    rideId: string;
    userId: string;
    seatNumber: number;
    status: string;
    createdAt: Date;
  };
  ride: {
    id: string;
    availableSeats: number;
    totalSeats: number;
    status: string;
  };
};
export {
  TRide,
  TRideUpdateSchema,
  TRideUpdateData,
  TRideDataSchema,
  TBookSeatSchema,
  TRideSeatSchema,
  TRideSeatLayoutSchema,
  TRideProviderSchema,
  TRideVehicleSchema,
  TRideAvailableSchema,
  TRideBookingDataSchema,
};
