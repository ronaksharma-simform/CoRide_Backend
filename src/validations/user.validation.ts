import { z } from "zod";

export const User = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 4 characters")
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore allowed"),

  first_name: z.string().min(1, "First name is required"),

  middle_name: z.string().optional().default(""),

  last_name: z.string().min(1, "Last name is required"),

  email: z
    .string()
    .email("Invalid email")
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20)
    .refine((val) => /[A-Z]/.test(val), {
      message: "Must contain at least one uppercase letter",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Must contain at least one lowercase letter",
    })
    .refine((val) => /[0-9]/.test(val), {
      message: "Must contain at least one number",
    })
    .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: "Must contain at least one special character",
    }),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

  org_name: z.string(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  gender: z.enum(["MALE", "FEMALE"]),
  is_org_verified: z.boolean().optional(),
  refreshToken: z.string().optional(),
  is_id_verified: z.boolean().optional(),
  avg_rating: z.number().optional(),
  total_rides: z.number().optional(),
  created_at: z.date().optional(),
});
type TUser = z.infer<typeof User>;
export { TUser };
export default User;
