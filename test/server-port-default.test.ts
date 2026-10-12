import { test, mock } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
delete process.env.PORT;
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/d";
process.env.ACCESS_TOKEN_SECRET = "access-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret-0123456789";
process.env.VERIFICATION_TOKEN_SECRET = "verify-secret-0123456789";
process.env.VERIFICATION_BASE_URL = "http://localhost/verify?token=";
process.env.LOG_LEVEL = "info";
process.env.EMAIL_USER = "a@b.com";
process.env.EMAIL_PASSWORD = "x";

test("startup log shows the default port when PORT is unset", async () => {
  const { default: app } = await import("../src/app");
  const { logger } = await import("../src/utils/logger");
  const listen = mock.method(
    app,
    "listen",
    (_port: unknown, cb?: () => void) => {
      cb?.();
      return {} as never;
    },
  );
  const debug = mock.method(logger, "debug", () => undefined);

  await import("../src/server");

  assert.equal(listen.mock.calls[0].arguments[0], 3000);
  assert.equal(debug.mock.calls[0].arguments[0], "Server running on port 3000");
});
