import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";

const freePort = (): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => resolve(port));
    });
  });

const wait = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

test("npm run build exits 0 and node boots dist/server.js", async () => {
  const build = spawnSync("npm", ["run", "build"], { encoding: "utf8" });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  const port = await freePort();
  const server = spawn("node", ["dist/server.js"], {
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      DATABASE_URL: "postgresql://example_user:example_pw@localhost:5432/d",
      ACCESS_TOKEN_SECRET: "example_access_0123456789",
      REFRESH_TOKEN_SECRET: "example_refresh_0123456789",
      VERIFICATION_TOKEN_SECRET: "example_verify_0123456789",
      VERIFICATION_BASE_URL: "http://localhost/verify?token=",
      LOG_LEVEL: "info",
      EMAIL_USER: "example@example.com",
      EMAIL_PASSWORD: "example_password",
    },
    stdio: "ignore",
  });
  try {
    let status = 0;
    for (let i = 0; i < 50 && !status; i++) {
      await wait(200);
      status = await fetch(`http://127.0.0.1:${port}/health`)
        .then((r): number => r.status)
        .catch(() => 0);
    }
    // /health sits behind auth: 401 proves the compiled app is serving.
    assert.equal(status, 401);
  } finally {
    server.kill();
  }
});
