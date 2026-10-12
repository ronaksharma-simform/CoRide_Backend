import "dotenv/config";
import ms, { StringValue } from "ms";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce
    .number("PORT must be a number")
    .int("PORT must be a whole number")
    .min(1, "PORT must be between 1 and 65535")
    .max(65535, "PORT must be between 1 and 65535")
    .default(3000),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          const validProtocol =
            parsed.protocol === "postgres:" ||
            parsed.protocol === "postgresql:";
          const hasHost = !!parsed.hostname;
          const hasDbName = !!parsed.pathname;
          const hasUser = !!parsed.username;
          const hasValidPort =
            !parsed.port ||
            (Number(parsed.port) > 0 && Number(parsed.port) <= 65535);
          return (
            validProtocol && hasHost && hasDbName && hasUser && hasValidPort
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "Invalid PostgreSQL URL. Expected format: postgres://user:password@host:port/dbname",
      },
    ),

  ACCESS_TOKEN_SECRET: z
    .string()
    .min(
      16,
      "ACCESS_TOKEN_SECRET is required and should be longer than 16 characters",
    ),
  ACCESS_TOKEN_EXPIRY: z
    .string()
    .default("1d")
    .refine(
      (val) => {
        try {
          return typeof ms(val as StringValue) === "number";
        } catch {
          return false;
        }
      },
      {
        message: "Invalid time format. Use values like '30m', '1h', '7d'",
      },
    ),

  REFRESH_TOKEN_SECRET: z
    .string()
    .min(
      16,
      "REFRESH_TOKEN_SECRET is required and should be longer than 16 characters",
    ),
  REFRESH_TOKEN_EXPIRY: z
    .string()
    .default("7d")
    .refine(
      (val) => {
        try {
          return typeof ms(val as StringValue) === "number";
        } catch {
          return false;
        }
      },
      {
        message: "Invalid time format. Use values like '30m', '1h', '7d'",
      },
    ),

  VERIFICATION_TOKEN_SECRET: z
    .string()
    .min(
      16,
      "VERIFICATION_TOKEN_SECRET is required and should be longer than 16 characters",
    ),
  VERIFICATION_TOKEN_EXPIRY: z
    .string()
    .default("60")
    .refine(
      (val) => {
        const parsed = Number(val);
        return !Number.isNaN(parsed) && parsed > 0;
      },
      {
        message:
          "VERIFICATION_TOKEN_EXPIRY must be a positive number representing minutes",
      },
    ),
  VERIFICATION_BASE_URL: z.url(),
  LOG_LEVEL: z.enum(["debug", "info"]),
  EMAIL_USER: z.email(),
  EMAIL_PASSWORD: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const problems = parsedEnv.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");
  console.error(`❌ Invalid environment variables:\n${problems}`);
  process.exit(1);
}

export const env = parsedEnv.data;
