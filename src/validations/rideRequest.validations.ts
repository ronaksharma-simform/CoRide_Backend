import { z } from "zod";
import { cooridinateSchema } from "./ride.validations";
export const RideRequest = z.object({
  rideId: z.uuid("Ride id is required"),
  priority: z
    .enum(["TIMEFIRST", "DISTANCEFIRST", "BALANCED"])
    .default("BALANCED"),
  meetingPoint: cooridinateSchema,
  distanceToRoute: z.float32("Distance is required"),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"]),
});
type TRideRequest = z.infer<typeof RideRequest>;
export { TRideRequest };
