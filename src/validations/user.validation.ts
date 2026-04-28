import * as z from "zod";

const User = z.object({
  id: z.string().uuid().optional(), // auto-generated
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email format"),
  password: z.string({}).min(8, "Password must be at least 8 characters long"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  org_name: z.string().min(2, "Organization must be at least 2 characters"),
  role: z.enum(["USER", "ADMIN"]),
  gender: z.enum(["Male", "Female"]),
  is_org_verified: z.boolean().optional().default(false),
  accessToken: z.hash("sha256").optional().default(""),
  is_id_verified: z.boolean().optional().default(false),
  avg_rating: z.number().min(0).max(5).optional().default(0),
  total_rides: z.number().int().min(0).optional().default(0),
  created_at: z.date().optional(), // auto-set
});
type TUser = z.infer<typeof User>;
export { TUser };
export default User;
