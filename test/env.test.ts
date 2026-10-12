import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const validEnv: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL:
    "postgresql://example_user:example_pw@localhost:5432/example_db",
  ACCESS_TOKEN_SECRET: "example_access_0123456789",
  REFRESH_TOKEN_SECRET: "example_refresh_0123456789",
  VERIFICATION_TOKEN_SECRET: "example_verify_0123456789",
  VERIFICATION_BASE_URL: "http://localhost/verify?token=",
  LOG_LEVEL: "info",
  EMAIL_USER: "a@b.com",
  EMAIL_PASSWORD: "example_mail_pw",
};

// Loads src/config/env in a fresh process so a failed parse cannot kill the test runner.
const loadEnv = (
  overrides: Record<string, string | undefined>,
): SpawnSyncReturns<string> => {
  const childEnv: Record<string, string> = { ...validEnv };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete childEnv[key];
    else childEnv[key] = value;
  }
  return spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "-e",
      'import("./src/config/env").then((m) => console.log("PORT=" + m.env.PORT))',
    ],
    { env: { PATH: process.env.PATH ?? "", ...childEnv }, encoding: "utf8" },
  );
};

test("missing DATABASE_URL stops startup and names the key", () => {
  const result = loadEnv({ DATABASE_URL: undefined });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL/);
});

test("PORT defaults to 3000 when unset", () => {
  const result = loadEnv({ PORT: undefined });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PORT=3000/);
});

test("PORT is parsed as a number", () => {
  const result = loadEnv({ PORT: "4321" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PORT=4321/);
});

test("a non-numeric PORT stops startup with a message naming the key", () => {
  const result = loadEnv({ PORT: "abc" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PORT/);
  assert.doesNotMatch(result.stderr, /at .*\.ts:\d+/);
});

test("no source file other than src/config/env.ts reads process.env", () => {
  const offenders: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== "generated") walk(path);
      } else if (
        path !== join("src", "config", "env.ts") &&
        /\.tsx?$/.test(name) &&
        readFileSync(path, "utf8").includes("process.env")
      ) {
        offenders.push(path);
      }
    }
  };
  walk("src");
  assert.deepEqual(offenders, []);
});
