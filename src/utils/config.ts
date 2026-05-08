import ms, { StringValue } from "ms";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z
    .string()
    .default("3000")
    .transform((val) => {
      const parsed = Number(val);
      if (Number.isNaN(parsed)) throw new Error("PORT must be a number");
      return parsed;
    }),
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

  // VERIFICATION_TOKEN_SECRET: z
  // 	.string()
  // 	.min(
  // 		16,
  // 		"VERIFICATION_TOKEN_SECRET is required and should be longer than 16 characters",
  // 	),
  // VERIFICATION_TOKEN_EXPIRY: z.string().default("5m").refine((val) => {
  //   try {
  //     return typeof ms(val as StringValue) === "number";
  //   } catch {
  //     return false;
  //   }
  // }, {
  //   message: "Invalid time format. Use values like '30m', '1h', '7d'",
  // }),
  // VERIFICATION_BASE_URL: z.url(),
  LOG_LEVEL: z.enum(["debug", "info"]),
  EMAIL_USER: z.email(),
  EMAIL_PASSWORD: z.string(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsedEnv.error.format(),
  );
  process.exit(1);
}

const env = parsedEnv.data;

export const config = {
  app: { env: env.NODE_ENV, port: env.PORT, logLevel: env.LOG_LEVEL },

  jwt: {
    access: {
      secret: env.ACCESS_TOKEN_SECRET,
      expiry: env.ACCESS_TOKEN_EXPIRY as StringValue,
    },
    refresh: {
      secret: env.REFRESH_TOKEN_SECRET,
      expiry: env.REFRESH_TOKEN_EXPIRY as StringValue,
    },
    // verification: {
    // 	secret: env.VERIFICATION_TOKEN_SECRET,
    // 	expiry: env.VERIFICATION_TOKEN_EXPIRY,
    // 	baseUrl: env.VERIFICATION_BASE_URL,
    // },
  },
  db: { url: env.DATABASE_URL },
  // email: { user: env.EMAIL_USER, password: env.EMAIL_PASSWORD },
} as const;
