import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/d";
process.env.ACCESS_TOKEN_SECRET = "access-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret-0123456789";
process.env.VERIFICATION_TOKEN_SECRET = "verify-secret-0123456789";
process.env.VERIFICATION_BASE_URL = "http://localhost/verify?token=";
process.env.LOG_LEVEL = "info";
process.env.EMAIL_USER = "a@b.com";
process.env.EMAIL_PASSWORD = "x";

const { decodeToken, TokenType } = await import("../src/utils/jwt.utils");
const { requireRole } = await import("../src/middlewares/role.middleware");
const { default: errorMiddleware } =
  await import("../src/middlewares/error.middleware");
const { default: AppError } = await import("../src/utils/customErrorClass");
const { UserRegistrationSchema } =
  await import("../src/validations/user.validation");

const run = (mw: unknown, user: unknown): unknown => {
  let error: unknown;
  (mw as (...a: unknown[]) => void)({ user }, {}, (e?: unknown) => {
    error = e;
  });
  return error;
};

test("expired access token is reported as TOKEN_EXPIRED", () => {
  const token = jwt.sign({ id: "u1" }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: -10,
  });
  assert.throws(
    () => decodeToken(token, TokenType.ACCESS),
    (e: { code: string; statusCode: number }) =>
      e.code === "TOKEN_EXPIRED" && e.statusCode === 401,
  );
});

test("tampered token is reported as AUTH_INVALID_TOKEN", () => {
  const token = jwt.sign({ id: "u1" }, "some-other-secret-0123456789");
  assert.throws(
    () => decodeToken(token, TokenType.ACCESS),
    (e: { code: string }) => e.code === "AUTH_INVALID_TOKEN",
  );
});

test("requireRole lets a matching role through", () => {
  assert.equal(run(requireRole("DRIVER"), { role: "DRIVER" }), undefined);
});

test("requireRole rejects the wrong role with 403 AUTH_FORBIDDEN", () => {
  const err = run(requireRole("DRIVER"), { role: "RIDER" }) as {
    code: string;
    statusCode: number;
  };
  assert.equal(err.code, "AUTH_FORBIDDEN");
  assert.equal(err.statusCode, 403);
});

test("requireRole rejects a missing user with 401", () => {
  const err = run(requireRole("DRIVER"), undefined) as { statusCode: number };
  assert.equal(err.statusCode, 401);
});

test("error middleware returns the machine-readable code", () => {
  let body: unknown;
  const res = {
    status: (): typeof res => res,
    json: (b: unknown): void => {
      body = b;
    },
  };
  errorMiddleware(
    new AppError("AUTH_TOKEN_MISSING"),
    {} as never,
    res as never,
    () => {},
  );
  assert.deepEqual(body, {
    success: false,
    code: "AUTH_TOKEN_MISSING",
    message: "Authorization token is missing",
  });
});

test("registration accepts RIDER or DRIVER and defaults to RIDER", () => {
  const base = {
    username: "alice",
    firstName: "A",
    lastName: "B",
    email: "a@b.com",
    password: "Passw0rd!x",
    phone: "9876543210",
    orgName: "Org",
    gender: "FEMALE",
  };
  assert.equal(UserRegistrationSchema.parse(base).role, "RIDER");
  assert.equal(
    UserRegistrationSchema.parse({ ...base, role: "DRIVER" }).role,
    "DRIVER",
  );
  assert.equal(
    UserRegistrationSchema.safeParse({ ...base, role: "ADMIN" }).success,
    false,
  );
});
