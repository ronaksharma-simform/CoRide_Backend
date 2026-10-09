import { test, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/d";
process.env.ACCESS_TOKEN_SECRET = "access-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret-0123456789";
process.env.VERIFICATION_TOKEN_SECRET = "verify-secret-0123456789";
process.env.VERIFICATION_BASE_URL = "http://localhost/verify?token=";
process.env.LOG_LEVEL = "info";
process.env.EMAIL_USER = "a@b.com";
process.env.EMAIL_PASSWORD = "x";

const { default: app } = await import("../src/app");
const { prisma } = await import("../src/config/prisma");

type Row = Record<string, unknown>;
const hash = await bcrypt.hash("Passw0rd!x", 4);
const profile = {
  username: "someone",
  firstName: "A",
  middleName: "",
  lastName: "B",
  phone: "9876543210",
  gender: "MALE",
};
const users: Record<string, Row> = {
  rider: {
    ...profile,
    id: "r1",
    role: "RIDER",
    email: "rider@x.com",
    password: hash,
    isIdVerified: true,
    refreshToken: "",
  },
  driver: {
    ...profile,
    id: "d1",
    role: "DRIVER",
    email: "driver@x.com",
    password: hash,
    isIdVerified: true,
    refreshToken: "rt",
  },
  unverified: {
    ...profile,
    id: "u1",
    role: "RIDER",
    email: "unv@x.com",
    password: hash,
    isIdVerified: false,
    refreshToken: "",
  },
};
// Stand in for the database: look users up by id or email from the table above.
(prisma.user as unknown as { findUnique: unknown }).findUnique = async ({
  where,
}: {
  where: { id?: string; email?: string };
}): Promise<Row | null> =>
  Object.values(users).find(
    (u) => u.id === where.id || u.email === where.email,
  ) ?? null;

const server = app.listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
after(() => server.close());

const token = (id: string, opts: jwt.SignOptions = { expiresIn: 60 }): string =>
  jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET!, opts);
const call = async (
  method: string,
  path: string,
  opts: { bearer?: string; body?: unknown } = {},
): Promise<{ status: number; json: { code?: string } }> => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(opts.bearer ? { authorization: `Bearer ${opts.bearer}` } : {}),
    },
    body: opts.body && method !== "GET" ? JSON.stringify(opts.body) : undefined,
  });
  return { status: res.status, json: (await res.json()) as { code?: string } };
};

test("protected route without a token is 401 AUTH_TOKEN_MISSING", async () => {
  const r = await call("GET", "/api/vehicle/vehicles");
  assert.equal(r.status, 401);
  assert.equal(r.json.code, "AUTH_TOKEN_MISSING");
});

test("expired token is 401 TOKEN_EXPIRED over HTTP", async () => {
  const r = await call("GET", "/api/vehicle/vehicles", {
    bearer: token("d1", { expiresIn: -10 }),
  });
  assert.equal(r.status, 401);
  assert.equal(r.json.code, "TOKEN_EXPIRED");
});

test("garbage token is 401 AUTH_INVALID_TOKEN over HTTP", async () => {
  const r = await call("GET", "/api/vehicle/vehicles", {
    bearer: "abc.def.ghi",
  });
  assert.equal(r.status, 401);
  assert.equal(r.json.code, "AUTH_INVALID_TOKEN");
});

test("token for a deleted user is rejected", async () => {
  const r = await call("GET", "/api/vehicle/vehicles", {
    bearer: token("ghost"),
  });
  assert.equal(r.status, 401);
});

test("rider is 403 AUTH_FORBIDDEN on every driver-only route", async () => {
  const bearer = token("r1");
  for (const [m, p] of [
    ["GET", "/api/vehicle/vehicles"],
    ["POST", "/api/vehicle"],
    ["DELETE", "/api/vehicle"],
    ["POST", "/api/ride"],
    ["PUT", "/api/ride"],
    ["DELETE", "/api/ride"],
  ] as const) {
    const r = await call(m, p, { bearer, body: {} });
    assert.equal(r.status, 403, `${m} ${p}`);
    assert.equal(r.json.code, "AUTH_FORBIDDEN", `${m} ${p}`);
  }
});

test("driver passes the role gate (fails later on validation, not 403)", async () => {
  const bearer = token("d1");
  for (const [m, p] of [
    ["POST", "/api/vehicle"],
    ["POST", "/api/ride"],
  ] as const) {
    const r = await call(m, p, { bearer, body: {} });
    assert.notEqual(r.status, 403, `${m} ${p}`);
    assert.notEqual(r.status, 401, `${m} ${p}`);
  }
});

test("registration refuses ADMIN self-signup", async () => {
  const r = await call("POST", "/auth/register", {
    body: {
      username: "newguy",
      firstName: "A",
      lastName: "B",
      email: "n@x.com",
      password: "Passw0rd!x",
      phone: "9876543210",
      orgName: "o",
      gender: "MALE",
      role: "ADMIN",
    },
  });
  assert.equal(r.status, 400);
});

test("login: unknown email and wrong password give the same error", async () => {
  const a = await call("POST", "/auth/login", {
    body: { email: "nobody@x.com", password: "Passw0rd!x" },
  });
  const b = await call("POST", "/auth/login", {
    body: { email: "rider@x.com", password: "Wrong0rd!xx" },
  });
  assert.equal(a.status, b.status);
  assert.equal(a.json.code, "AUTH_INVALID_CREDENTIALS");
  assert.equal(b.json.code, "AUTH_INVALID_CREDENTIALS");
});

test("login: valid verified user gets an access token that works", async () => {
  const r = await call("POST", "/auth/login", {
    body: { email: "driver@x.com", password: "Passw0rd!x" },
  });
  assert.equal(r.status, 200);
  const at = (r.json as { accessToken?: string }).accessToken;
  assert.ok(at);
  const ok = await call("GET", "/health", { bearer: at });
  assert.equal(ok.status, 200);
});

test("login: unverified account is refused", async () => {
  const r = await call("POST", "/auth/login", {
    body: { email: "unv@x.com", password: "Passw0rd!x" },
  });
  assert.equal(r.json.code, "AUTH_ACCOUNT_NOT_VERIFIED");
});

test("refresh without cookie is AUTH_TOKEN_MISSING", async () => {
  const r = await call("POST", "/auth/refresh-token");
  assert.equal(r.json.code, "AUTH_TOKEN_MISSING");
});
