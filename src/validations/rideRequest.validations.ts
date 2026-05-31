import { z } from "zod";
import { cooridinateSchema } from "./ride.validations";
export const RideRequest = z.object({
  rideId: z.uuid("Ride id is required"),
  priority: z
    .enum(["TIMEFIRST", "DISTANCEFIRST", "BALANCED"])
    .default("BALANCED"),
  sourcePoint: cooridinateSchema,
  // meetingPoint: cooridinateSchema,
  // distanceToRoute: z
  //   .float32("Distance is required")
  //   .refine((data) => data > 0, {
  //     message: "Distance should be positive number",
  //   }),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"]),
});
type TRideRequest = z.infer<typeof RideRequest>;
export { TRideRequest };
