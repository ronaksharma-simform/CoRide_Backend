import { test, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import express from "express";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/d";
process.env.ACCESS_TOKEN_SECRET = "access-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret-0123456789";
process.env.VERIFICATION_TOKEN_SECRET = "verify-secret-0123456789";
process.env.VERIFICATION_BASE_URL = "http://localhost/verify?token=";
process.env.LOG_LEVEL = "info";
process.env.EMAIL_USER = "a@b.com";
process.env.EMAIL_PASSWORD = "x";

const { requestLogger } =
  await import("../src/middlewares/requestLogger.middleware");

const lines: string[] = [];
const fakeLog = { info: (msg: string): number => lines.push(msg) };

const build = (opts: Parameters<typeof requestLogger>[0]): string => {
  const app = express();
  app.use(express.json());
  app.use(requestLogger(opts));
  app.post("/things", (_req, res) => res.status(201).json({ ok: true }));
  const server = app.listen(0);
  after(() => server.close());
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
};

test("logs one line with method, path, status and ms", async () => {
  lines.length = 0;
  const base = build({ log: fakeLog, enabled: true });
  await fetch(`${base}/things`, { method: "POST" });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^POST \/things 201 \d+(\.\d+)?ms$/);
});

test("never logs the body, Authorization header or query string", async () => {
  lines.length = 0;
  const base = build({ log: fakeLog, enabled: true });
  await fetch(`${base}/things?token=query-secret`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer header-secret",
    },
    body: JSON.stringify({ password: "body-secret" }),
  });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(lines.length, 1);
  for (const secret of ["header-secret", "body-secret", "query-secret"]) {
    assert.ok(!lines[0].includes(secret), `leaked ${secret}`);
  }
});

test("stays silent when disabled", async () => {
  lines.length = 0;
  const base = build({ log: fakeLog, enabled: false });
  await fetch(`${base}/things`, { method: "POST" });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(lines.length, 0);
});

test("is off by default when NODE_ENV=test", async () => {
  lines.length = 0;
  const base = build({ log: fakeLog });
  await fetch(`${base}/things`, { method: "POST" });
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(lines.length, 0);
});
