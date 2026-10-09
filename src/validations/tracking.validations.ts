import { z } from "zod";
import { cooridinateSchema } from "./ride.validations";

export const LocationSchema = cooridinateSchema.extend({
  recordedAt: z.coerce.date().optional(),
});
export type TLocation = z.infer<typeof LocationSchema>;
