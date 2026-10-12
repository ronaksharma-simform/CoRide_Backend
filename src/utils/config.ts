import { StringValue } from "ms";
import { env } from "@/config/env";

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
    verification: {
      secret: env.VERIFICATION_TOKEN_SECRET,
      expiry: Number.parseInt(env.VERIFICATION_TOKEN_EXPIRY),
      baseUrl: env.VERIFICATION_BASE_URL,
    },
  },
  db: { url: env.DATABASE_URL },
  email: { user: env.EMAIL_USER, password: env.EMAIL_PASSWORD },
} as const;
