import { z } from "zod";

export const IdSchema = z.object({
  id: z.uuid("Id is required"),
});
type TIdSchema = z.infer<typeof IdSchema>;
export { TIdSchema };
