import { z } from "zod";
import { cooridinateSchema } from "@/validations/ride.validations";

export const MatchRequestSchema = z.object({
  pickup: cooridinateSchema,
  destination: cooridinateSchema,
});
export type TMatchRequest = z.infer<typeof MatchRequestSchema>;
