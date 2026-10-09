/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { test } from "node:test";
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

const svc = await import("../src/services/match.services");
const { canApply } = await import("../src/services/match.rules");
const { MatchRequestSchema } =
  await import("../src/validations/match.validations");

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** In-memory stand-in for a Prisma transaction client. `nearby` is the ride ids PostGIS would return, nearest first. */
const fakeTx = (nearby: string[], rides: Record<string, Row>) => {
  const requests: Record<string, Row> = {};
  const events: Row[] = [];
  let n = 0;
  const tx = {
    requests,
    events,
    rides,
    $queryRaw: async (_s: unknown, ...vals: unknown[]) => {
      const excluded = vals.find(Array.isArray) as string[];
      const id = nearby.find(
        (r) => !excluded.includes(r) && rides[r].availableSeats > 0,
      );
      return id ? [{ id }] : [];
    },
    rideRequest: {
      create: async ({ data }: Row) =>
        (requests[`q${++n}`] = {
          id: `q${n}`,
          status: "PENDING",
          rideId: null,
          ...data,
        }),
      findUnique: async ({ where }: Row) => {
        const q = requests[where.id];
        return q ? { ...q, ride: rides[q.rideId] ?? null } : null;
      },
      update: async ({ where, data }: Row) =>
        Object.assign(requests[where.id], data),
    },
    matchEvent: {
      create: async ({ data }: Row) => void events.push(data),
      findMany: async ({ where }: Row) =>
        events.filter(
          (e) => e.requestId === where.requestId && e.type === where.type,
        ),
    },
    ride: {
      updateMany: async ({ where, data }: Row) => {
        const r = rides[where.id];
        if (!r) return { count: 0 };
        if (where.status && r.status !== where.status) return { count: 0 };
        if (
          where.availableSeats?.gt !== undefined &&
          !(r.availableSeats > where.availableSeats.gt)
        )
          return { count: 0 };
        if (
          typeof where.availableSeats === "number" &&
          r.availableSeats !== where.availableSeats
        )
          return { count: 0 };
        if (data.availableSeats?.decrement) r.availableSeats -= 1;
        if (data.availableSeats?.increment) r.availableSeats += 1;
        if (data.status) r.status = data.status;
        return { count: 1 };
      },
    },
  };
  return tx;
};
const input = {
  pickup: { lat: 12.9, lng: 77.6 },
  destination: { lat: 13, lng: 77.7 },
};
const ride = (providerId: string, seats = 2): Row => ({
  providerId,
  availableSeats: seats,
  status: "ACTIVE",
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const as = (t: unknown): any => t;

test("a request is assigned to the nearest available ride", async () => {
  const tx = fakeTx(["near", "far"], { near: ride("d1"), far: ride("d2") });
  const r = await svc.requestMatch(as(tx), "rider", input);
  assert.equal(r.status, "ASSIGNED");
  assert.equal(r.rideId, "near");
  assert.deepEqual(
    tx.events.map((e) => e.type),
    ["REQUESTED", "ASSIGNED"],
  );
});

test("no available driver ends in NO_DRIVERS, not an error", async () => {
  const tx = fakeTx([], {});
  const r = await svc.requestMatch(as(tx), "rider", input);
  assert.equal(r.status, "NO_DRIVERS");
  assert.equal(r.rideId, null);
  assert.equal(tx.events.at(-1)?.type, "NO_DRIVERS");
});

test("driver accept takes a seat and marks the ride FULL at zero", async () => {
  const tx = fakeTx(["a"], { a: ride("d1", 1) });
  const q = await svc.requestMatch(as(tx), "rider", input);
  const r = await svc.acceptMatch(as(tx), q.id, "d1");
  assert.equal(r.status, "ACCEPTED");
  assert.equal(tx.rides.a.availableSeats, 0);
  assert.equal(tx.rides.a.status, "FULL");
});

test("only the offered driver may accept", async () => {
  const tx = fakeTx(["a"], { a: ride("d1") });
  const q = await svc.requestMatch(as(tx), "rider", input);
  await assert.rejects(
    svc.acceptMatch(as(tx), q.id, "other"),
    (e: { code: string }) => e.code === "RIDE_UNAUTHORIZED_ACTION",
  );
});

test("reject reassigns to the next nearest and never re-offers the rejected ride", async () => {
  const tx = fakeTx(["a", "b"], { a: ride("d1"), b: ride("d2") });
  const q = await svc.requestMatch(as(tx), "rider", input);
  const r = await svc.rejectMatch(as(tx), q.id, "d1");
  assert.equal(r.status, "ASSIGNED");
  assert.equal(r.rideId, "b");
  const again = await svc.rejectMatch(as(tx), q.id, "d2");
  assert.equal(again.status, "NO_DRIVERS");
});

test("accept when the last seat just went reassigns instead of overbooking", async () => {
  const tx = fakeTx(["a", "b"], { a: ride("d1", 1), b: ride("d2") });
  const q = await svc.requestMatch(as(tx), "rider", input);
  tx.rides.a.availableSeats = 0; // another rider took it
  const r = await svc.acceptMatch(as(tx), q.id, "d1");
  assert.equal(r.status, "ASSIGNED");
  assert.equal(r.rideId, "b");
  assert.equal(tx.rides.a.availableSeats, 0);
});

test("rider cancel frees the seat and reopens a FULL ride", async () => {
  const tx = fakeTx(["a"], { a: ride("d1", 1) });
  const q = await svc.requestMatch(as(tx), "rider", input);
  await svc.acceptMatch(as(tx), q.id, "d1");
  const r = await svc.cancelMatch(as(tx), q.id, "rider");
  assert.equal(r.status, "CANCELLED");
  assert.equal(tx.rides.a.availableSeats, 1);
  assert.equal(tx.rides.a.status, "ACTIVE");
});

test("cancel by another rider, or on a finished request, is refused", async () => {
  const tx = fakeTx(["a"], { a: ride("d1") });
  const q = await svc.requestMatch(as(tx), "rider", input);
  await assert.rejects(
    svc.cancelMatch(as(tx), q.id, "x"),
    (e: { code: string }) => e.code === "RIDE_UNAUTHORIZED_ACTION",
  );
  await svc.cancelMatch(as(tx), q.id, "rider");
  await assert.rejects(
    svc.cancelMatch(as(tx), q.id, "rider"),
    (e: { code: string }) => e.code === "MATCH_INVALID_STATE",
  );
  await assert.rejects(
    svc.acceptMatch(as(tx), "missing", "d1"),
    (e: { code: string }) => e.code === "MATCH_REQUEST_NOT_FOUND",
  );
});

test("state guard and request schema", () => {
  assert.equal(canApply("ACCEPTED", "accept"), false);
  assert.equal(canApply("ASSIGNED", "reject"), true);
  assert.equal(MatchRequestSchema.safeParse(input).success, true);
  assert.equal(
    MatchRequestSchema.safeParse({
      pickup: { lat: 99, lng: 0 },
      destination: input.destination,
    }).success,
    false,
  );
});
