import { test, mock } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/d";
process.env.ACCESS_TOKEN_SECRET = "access-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret-0123456789";
process.env.VERIFICATION_TOKEN_SECRET = "verify-secret-0123456789";
process.env.VERIFICATION_BASE_URL = "http://localhost/verify?token=";
process.env.LOG_LEVEL = "info";
process.env.EMAIL_USER = "a@b.com";
process.env.EMAIL_PASSWORD = "x";

const { prisma } = await import("../src/config/prisma");
const { TrackingService, assertTransition, assertFreshFix, tripEvents } =
  await import("../src/services/tracking.services");
const { LocationSchema } =
  await import("../src/validations/tracking.validations");

const code =
  (c: string) =>
  (e: { code: string }): boolean =>
    e.code === c;
const db: Record<string, Record<string, () => unknown>> = {
  ride: { findUnique: () => null, update: () => null },
  rideLocation: { findFirst: () => null, create: () => null },
  rideStatusHistory: { create: () => null },
};
for (const [name, delegate] of Object.entries(db)) {
  Object.defineProperty(prisma, name, { value: delegate, configurable: true });
}
const stubRide = (status: string, providerId = "u1"): unknown =>
  mock.method(db.ride, "findUnique", async () => ({
    id: "r1",
    status,
    providerId,
  }));

test("payload and fix checks reject bad coordinates, stale and out-of-order fixes", () => {
  assert.equal(LocationSchema.safeParse({ lat: 91, lng: 0 }).success, false);
  assert.equal(LocationSchema.safeParse({ lat: "x", lng: 0 }).success, false);
  const now = new Date("2026-01-01T00:10:00Z");
  const at = (t: string): Date => new Date(`2026-01-01T${t}Z`);
  assert.doesNotThrow(() => assertFreshFix(at("00:09:30"), now));
  const bad = code("RIDE_INVALID_LOCATION");
  assert.throws(() => assertFreshFix(at("00:05:00"), now), bad);
  assert.throws(() => assertFreshFix(at("00:11:00"), now), bad);
  assert.throws(() => assertFreshFix(at("00:09:00"), now, at("00:09:30")), bad);
});

test("status transitions follow the lifecycle and reject skips", () => {
  assert.doesNotThrow(() => assertTransition("ACTIVE", "IN_PROGRESS"));
  assert.throws(
    () => assertTransition("ACTIVE", "COMPLETED"),
    code("RIDE_INVALID_STATUS_TRANSITION"),
  );
});

test("starting a ride updates status, logs history and emits an event", async () => {
  stubRide("ACTIVE");
  const update = mock.method(db.ride, "update", () => "u");
  const hist = mock.method(db.rideStatusHistory, "create", () => "h");
  Object.defineProperty(prisma, "$transaction", {
    value: async () => [{ id: "r1", status: "IN_PROGRESS" }],
    configurable: true,
  });
  const events: unknown[] = [];
  tripEvents.once("status", (e) => events.push(e));
  const out = await TrackingService.changeStatus("r1", "u1", "IN_PROGRESS");
  assert.equal(out.status, "IN_PROGRESS");
  assert.equal(update.mock.callCount(), 1);
  assert.deepEqual(hist.mock.calls[0].arguments[0], {
    data: {
      rideId: "r1",
      fromStatus: "ACTIVE",
      toStatus: "IN_PROGRESS",
      changedBy: "u1",
    },
  });
  assert.equal(events.length, 1);
  mock.restoreAll();
});

test("only the ride's driver can act, and only while in progress", async () => {
  stubRide("ACTIVE", "someone-else");
  await assert.rejects(
    TrackingService.changeStatus("r1", "u1", "IN_PROGRESS"),
    code("RIDE_UNAUTHORIZED_ACTION"),
  );
  mock.restoreAll();
  stubRide("ACTIVE");
  await assert.rejects(
    TrackingService.recordLocation("r1", "u1", { lat: 1, lng: 2 }),
    code("RIDE_NOT_IN_PROGRESS"),
  );
  mock.restoreAll();
});

test("a valid fix is stored and emitted; an older one is refused", async () => {
  stubRide("IN_PROGRESS");
  mock.method(db.rideLocation, "findFirst", async () => ({
    recordedAt: new Date(Date.now() - 10_000),
  }));
  const create = mock.method(
    db.rideLocation,
    "create",
    async (a: { data: { lat: number; lng: number } }) => ({
      lat: a.data.lat,
      lng: a.data.lng,
      recordedAt: new Date(),
    }),
  );
  const saved = await TrackingService.recordLocation("r1", "u1", {
    lat: 1,
    lng: 2,
  });
  assert.equal(saved.lat, 1);
  assert.equal(create.mock.callCount(), 1);
  await assert.rejects(
    TrackingService.recordLocation("r1", "u1", {
      lat: 1,
      lng: 2,
      recordedAt: new Date(Date.now() - 60_000),
    }),
    code("RIDE_INVALID_LOCATION"),
  );
  assert.equal(create.mock.callCount(), 1);
  mock.restoreAll();
});
