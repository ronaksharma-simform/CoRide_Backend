import { test, after } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
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

const { default: app } = await import("../src/app");
const { prisma } = await import("../src/config/prisma");
const { tripEvents } = await import("../src/services/tracking.services");

type Row = Record<string, unknown>;
const profile = {
  username: "someone",
  firstName: "A",
  middleName: "",
  lastName: "B",
  phone: "9876543210",
  gender: "MALE",
  isIdVerified: true,
  refreshToken: "rt",
  password: "x",
};
const users: Row[] = [
  { ...profile, id: "d1", role: "DRIVER", email: "d1@x.com" },
  { ...profile, id: "d2", role: "DRIVER", email: "d2@x.com" },
  { ...profile, id: "r1", role: "RIDER", email: "r1@x.com" },
];
const ride: Row = {
  id: "11111111-1111-4111-8111-111111111111",
  status: "ACTIVE",
  providerId: "d1",
};
const rideId = ride.id as string;
const locations: Row[] = [];
const history: Row[] = [];

// In-memory stand-in for the tables the tracking endpoints touch.
const stub = (target: object, name: string, value: unknown): void => {
  Object.defineProperty(target, name, { value, configurable: true });
};
stub(
  prisma.user,
  "findUnique",
  async ({ where }: { where: { id: string } }) =>
    users.find((u) => u.id === where.id) ?? null,
);
stub(prisma.ride, "findUnique", async ({ where }: { where: { id: string } }) =>
  where.id === rideId
    ? {
        ...ride,
        locations: locations.slice(-1).map((l) => ({ ...l })),
        statusHistory: history.map((h) => ({ ...h })),
      }
    : null,
);
stub(prisma.ride, "update", ({ data }: { data: Row }) => {
  Object.assign(ride, data);
  return Promise.resolve({ id: ride.id, status: ride.status });
});
stub(prisma.rideStatusHistory, "create", ({ data }: { data: Row }) => {
  history.push({ ...data, createdAt: new Date() });
  return Promise.resolve(data);
});
stub(prisma, "$transaction", (ops: Promise<unknown>[]) => Promise.all(ops));
stub(prisma.rideLocation, "findFirst", async () => locations.at(-1) ?? null);
stub(prisma.rideLocation, "create", async ({ data }: { data: Row }) => {
  locations.push(data);
  return data;
});

const server = app.listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
after(() => server.close());

const bearer = (id: string): string =>
  jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: 60 });
const call = async (
  method: string,
  path: string,
  who?: string,
  body?: unknown,
): Promise<{ status: number; json: { code?: string; data?: Row } }> => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(who ? { authorization: `Bearer ${bearer(who)}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: (await res.json()) as never };
};

test("tracking routes need a token and a driver", async () => {
  assert.equal((await call("POST", `/api/ride/${rideId}/start`)).status, 401);
  assert.equal((await call("GET", `/api/ride/${rideId}/status`)).status, 401);
  const r = await call("POST", `/api/ride/${rideId}/start`, "r1");
  assert.equal(r.status, 403);
  const other = await call("POST", `/api/ride/${rideId}/start`, "d2");
  assert.equal(other.json.code, "RIDE_UNAUTHORIZED_ACTION");
});

test("location before the trip starts is refused with 409", async () => {
  const r = await call("POST", `/api/ride/${rideId}/location`, "d1", {
    lat: 1,
    lng: 2,
  });
  assert.equal(r.status, 409);
  assert.equal(r.json.code, "RIDE_NOT_IN_PROGRESS");
});

test("a driver walks a ride through start, location, complete and history logs each step", async () => {
  const events: unknown[] = [];
  tripEvents.on("location", (e) => events.push(e));
  assert.equal(
    (await call("POST", `/api/ride/${rideId}/start`, "d1")).status,
    200,
  );
  assert.equal(
    (await call("POST", `/api/ride/${rideId}/start`, "d1")).status,
    409,
  );

  const fix = await call("POST", `/api/ride/${rideId}/location`, "d1", {
    lat: 12.9,
    lng: 77.6,
  });
  assert.equal(fix.status, 201);
  assert.equal(events.length, 1);

  const view = await call("GET", `/api/ride/${rideId}/status`, "r1");
  assert.equal(view.status, 200);
  const data = view.json.data as {
    status: string;
    currentLocation: Row;
    statusHistory: Row[];
  };
  assert.equal(data.status, "IN_PROGRESS");
  assert.equal(data.currentLocation.lat, 12.9);
  assert.deepEqual(
    data.statusHistory.map((h) => [h.fromStatus, h.toStatus]),
    [["ACTIVE", "IN_PROGRESS"]],
  );

  assert.equal(
    (await call("POST", `/api/ride/${rideId}/complete`, "d1")).status,
    200,
  );
  const done = (await call("GET", `/api/ride/${rideId}/status`, "r1")).json
    .data as { statusHistory: Row[] };
  assert.equal(done.statusHistory.length, 2);
  assert.equal(done.statusHistory[1].toStatus, "COMPLETED");
  // A completed ride accepts no further fixes or transitions.
  assert.equal(
    (
      await call("POST", `/api/ride/${rideId}/location`, "d1", {
        lat: 1,
        lng: 2,
      })
    ).status,
    409,
  );
  assert.equal(
    (await call("POST", `/api/ride/${rideId}/start`, "d1")).status,
    409,
  );
  tripEvents.removeAllListeners("location");
});

test("invalid location payloads are 400, not 500", async () => {
  Object.assign(ride, { status: "IN_PROGRESS" });
  const bad: unknown[] = [
    { lat: 91, lng: 0 },
    { lat: 0, lng: -181 },
    { lat: "12", lng: 0 },
    { lat: 1 },
    {},
    { lat: 1, lng: 2, recordedAt: "not-a-date" },
  ];
  for (const body of bad) {
    const r = await call("POST", `/api/ride/${rideId}/location`, "d1", body);
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  const nonUuid = await call("GET", "/api/ride/nope/status", "r1");
  assert.equal(nonUuid.status, 400);
  const missing = await call(
    "GET",
    "/api/ride/22222222-2222-4222-8222-222222222222/status",
    "r1",
  );
  assert.equal(missing.status, 404);
});

test("PUT /api/ride cannot skip the lifecycle", async () => {
  Object.assign(ride, { status: "ACTIVE" });
  const r = await call("PUT", "/api/ride", "d1", {
    id: rideId,
    data: { status: "COMPLETED" },
  });
  assert.equal(r.status, 409);
  assert.equal(r.json.code, "RIDE_INVALID_STATUS_TRANSITION");
});

test("a client-sent recordedAt is accepted when fresh and rejected 400 when stale or in the future", async () => {
  Object.assign(ride, { status: "IN_PROGRESS" });
  locations.length = 0;
  const at = (ms: number): string => new Date(Date.now() + ms).toISOString();
  const path = `/api/ride/${rideId}/location`;
  const fresh = await call("POST", path, "d1", {
    lat: 1,
    lng: 2,
    recordedAt: at(-5_000),
  });
  assert.equal(fresh.status, 201);
  for (const ms of [-10 * 60_000, 10 * 60_000]) {
    const r = await call("POST", path, "d1", {
      lat: 1,
      lng: 2,
      recordedAt: at(ms),
    });
    assert.equal(r.status, 400, `recordedAt ${ms}ms from now`);
    assert.equal(r.json.code, "RIDE_INVALID_LOCATION");
  }
});
