import { z } from "zod";

export const User = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 4 characters")
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscore allowed"),

  firstName: z.string().min(1, "First name is required"),

  middleName: z.string().optional().default(""),

  lastName: z.string().min(1, "Last name is required"),

  email: z
    .string()
    .email("Invalid email")
    .transform((val) => val.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(20)
    .superRefine((val, ctx) => {
      let hasUpper = false;
      let hasLower = false;
      let hasNumber = false;
      let hasSpecial = false;

      for (const ch of val) {
        if (/[A-Z]/.test(ch)) hasUpper = true;
        else if (/[a-z]/.test(ch)) hasLower = true;
        else if (/[0-9]/.test(ch)) hasNumber = true;
        else hasSpecial = true;
      }

      if (!hasUpper) {
        ctx.addIssue("Must contain uppercase");
      }

      if (!hasLower) {
        ctx.addIssue("Must contain lowercase");
      }

      if (!hasNumber) {
        ctx.addIssue("Must contain number");
      }

      if (!hasSpecial) {
        ctx.addIssue("Must contain special character");
      }
    }),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),

  orgName: z.string(),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  gender: z.enum(["MALE", "FEMALE"]),
  isOrgVerified: z.boolean().optional(),
  refreshToken: z.string().optional(),
  isIdVerified: z.boolean().optional(),
  avgRating: z.number().optional(),
  totalRides: z.number().optional(),
  createdAt: z.date().optional(),
});

export const UserRegistrationSchema = User.pick({
  username: true,
  firstName: true,
  middleName: true,
  lastName: true,
  email: true,
  password: true,
  phone: true,
  orgName: true,
  gender: true,
  role: true,
});
export const UserLoginSchema = User.pick({
  email: true,
  password: true,
});
export const UserResponseSchema = User.pick({
  username: true,
  firstName: true,
  middleName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  gender: true,
  avgRating: true,
  totalRides: true,
  createdAt: true,
});
type TUser = z.infer<typeof User>;
type TUserRegistrationSchema = z.infer<typeof UserRegistrationSchema>;
type TUserLoginSchema = z.infer<typeof UserLoginSchema>;
type TUserResponseSchema = z.infer<typeof UserResponseSchema>;
export {
  TUser,
  TUserRegistrationSchema,
  TUserLoginSchema,
  TUserResponseSchema,
};
