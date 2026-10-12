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

const { calculateFare, surgeFor } = await import("../src/utils/fare");
const { prisma } = await import("../src/config/prisma");
const { PaymentService, PAYMENT_TIMEOUT_MS } =
  await import("../src/services/payment.services");
const { paymentGateway } = await import("../src/services/paymentGateway");

// ---- fare maths -------------------------------------------------------

test("fare = base + distance + time, in whole minor units", () => {
  const f = calculateFare({
    distanceMeters: 10_000,
    durationMinutes: 20,
    surgeMultiplier: 1,
  });
  assert.equal(f.baseFare, 50);
  assert.equal(f.distanceFare, 120);
  assert.equal(f.timeFare, 40);
  assert.equal(f.amount, 210);
  assert.ok(Number.isInteger(f.amount));
});

test("surge multiplies the metered part and the amount rounds to an integer", () => {
  const f = calculateFare({
    distanceMeters: 10_000,
    durationMinutes: 20,
    surgeMultiplier: 1.5,
  });
  assert.equal(f.amount, 315);
  const odd = calculateFare({
    distanceMeters: 3_333,
    durationMinutes: 7,
    surgeMultiplier: 1.25,
  });
  assert.ok(Number.isInteger(odd.amount));
});

test("a short trip is charged the minimum fare", () => {
  const f = calculateFare({
    distanceMeters: 100,
    durationMinutes: 1,
    surgeMultiplier: 1,
  });
  assert.equal(f.amount, 80);
});

test("bad fare inputs are rejected", () => {
  for (const bad of [
    { distanceMeters: -1, durationMinutes: 5, surgeMultiplier: 1 },
    { distanceMeters: 100, durationMinutes: -5, surgeMultiplier: 1 },
    { distanceMeters: 100, durationMinutes: 5, surgeMultiplier: 0.5 },
    { distanceMeters: NaN, durationMinutes: 5, surgeMultiplier: 1 },
  ]) {
    assert.throws(
      () => calculateFare(bad),
      (e: { code: string }) => e.code === "RIDE_INVALID_FARE",
    );
  }
});

test("surge rises with seat demand", () => {
  assert.equal(surgeFor(4, 4), 1);
  assert.equal(surgeFor(4, 2), 1.25);
  assert.equal(surgeFor(4, 0), 1.5);
});

// ---- payment workflow over a stubbed database -------------------------

type Row = Record<string, unknown>;
const rides: Record<string, Row> = {
  done: {
    id: "ride-done",
    providerId: "d1",
    status: "COMPLETED",
    totalSeats: 4,
    availableSeats: 0,
    departureTime: new Date("2026-06-01T10:00:00Z"),
    updatedAt: new Date("2026-06-01T10:20:00Z"),
  },
  active: {
    id: "ride-active",
    providerId: "d1",
    status: "ACTIVE",
    totalSeats: 4,
    availableSeats: 4,
    departureTime: new Date("2026-06-01T10:00:00Z"),
    updatedAt: new Date("2026-06-01T10:00:00Z"),
  },
};
let payments: Row[] = [];
let seq = 0;
const db = prisma as unknown as Record<string, Record<string, unknown>>;
db.ride.findUnique = async ({ where }: { where: { id: string } }) =>
  Object.values(rides).find((r) => r.id === where.id) ?? null;
db.$queryRaw = async () => [{ meters: 10_000 }];
const matches = (row: Row, where: Row): boolean =>
  Object.entries(where).every(([k, v]) => {
    if (k === "rideId_riderId") {
      const c = v as { rideId: string; riderId: string };
      return row.rideId === c.rideId && row.riderId === c.riderId;
    }
    if (k === "ride")
      return (
        (rides[row.rideId === "ride-done" ? "done" : "active"]
          .providerId as string) === (v as { providerId: string }).providerId
      );
    if (v && typeof v === "object" && "in" in v)
      return (v as { in: unknown[] }).in.includes(row[k]);
    return row[k] === v;
  });
const withRide = (p: Row): Row => ({
  ...p,
  ride: {
    providerId: rides[p.rideId === "ride-done" ? "done" : "active"].providerId,
  },
});
db.payment = {
  findUnique: async ({ where }: { where: Row }) => {
    const p = payments.find((x) => matches(x, where));
    return p ? withRide(p) : null;
  },
  findMany: async ({ where }: { where: Row }) =>
    payments.filter((x) => matches(x, where)).map(withRide),
  create: async ({ data }: { data: Row }) => {
    const row = {
      id: `pay-${++seq}`,
      status: "PENDING",
      createdAt: new Date(),
      ...data,
    };
    payments.push(row);
    return { ...row };
  },
  updateMany: async ({ where, data }: { where: Row; data: Row }) => {
    const hit = payments.filter((x) => matches(x, where));
    hit.forEach((x) => Object.assign(x, data));
    return { count: hit.length };
  },
};

const rider = { id: "r1", role: "RIDER" } as never;
const other = { id: "r2", role: "RIDER" } as never;
const driver = { id: "d1", role: "DRIVER" } as never;
const admin = { id: "a1", role: "ADMIN" } as never;
const reset = (): void => {
  payments = [];
  paymentGateway.charge = async () => ({ ok: true, reference: "gw-1" });
};
const code = (c: string) => (e: { code: string }) => e.code === c;

test("a completed ride gets its fare calculated server-side and stored", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  assert.equal(p.status, "PENDING");
  assert.equal(p.distanceMeters, 10_000);
  assert.equal(p.durationMinutes, 20);
  assert.equal(p.surgeMultiplier, 1.5);
  assert.equal(p.amount, 315);
  assert.equal(payments.length, 1);
});

test("a ride that is not completed cannot be paid", async () => {
  reset();
  await assert.rejects(
    PaymentService.createPayment("ride-active", rider),
    code("PAYMENT_RIDE_NOT_COMPLETED"),
  );
  await assert.rejects(
    PaymentService.createPayment("nope", rider),
    code("RIDE_NOT_FOUND"),
  );
});

test("the driver cannot pay for their own ride, nor pay twice", async () => {
  reset();
  await assert.rejects(
    PaymentService.createPayment("ride-done", {
      id: "d1",
      role: "RIDER",
    } as never),
    code("RIDE_CANNOT_JOIN_OWN_RIDE"),
  );
  await PaymentService.createPayment("ride-done", rider);
  await assert.rejects(
    PaymentService.createPayment("ride-done", rider),
    code("PAYMENT_ALREADY_EXISTS"),
  );
});

test("confirm charges once and marks the payment SUCCEEDED", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  let calls = 0;
  paymentGateway.charge = async (req) => {
    calls++;
    assert.equal(req.idempotencyKey, p.id);
    assert.equal(req.amount, 315);
    return { ok: true, reference: "gw-9" };
  };
  const done = (await PaymentService.confirmPayment(
    p.id as string,
    rider,
  )) as Row;
  assert.equal(done.status, "SUCCEEDED");
  assert.equal(done.gatewayRef, "gw-9");
  assert.ok(done.paidAt instanceof Date);
  await assert.rejects(
    PaymentService.confirmPayment(p.id as string, rider),
    code("PAYMENT_INVALID_STATE"),
  );
  assert.equal(calls, 1);
});

test("only the paying rider can confirm", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  await assert.rejects(
    PaymentService.confirmPayment(p.id as string, other),
    code("AUTH_FORBIDDEN"),
  );
});

test("a declined charge is FAILED with a reason, and can be retried", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  paymentGateway.charge = async () => ({ ok: false, reason: "card declined" });
  const failed = (await PaymentService.confirmPayment(
    p.id as string,
    rider,
  )) as Row;
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.failureReason, "card declined");
  paymentGateway.charge = async () => ({ ok: true, reference: "gw-2" });
  const retry = (await PaymentService.confirmPayment(
    p.id as string,
    rider,
  )) as Row;
  assert.equal(retry.status, "SUCCEEDED");
});

test("a gateway that throws leaves the payment FAILED, not stuck", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  paymentGateway.charge = async () => {
    throw new Error("socket hang up");
  };
  const failed = (await PaymentService.confirmPayment(
    p.id as string,
    rider,
  )) as Row;
  assert.equal(failed.status, "FAILED");
  assert.match(String(failed.failureReason), /gateway/i);
});

test("a payment left PENDING past the timeout becomes TIMED_OUT", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  payments[0].createdAt = new Date(Date.now() - PAYMENT_TIMEOUT_MS - 1000);
  await assert.rejects(
    PaymentService.confirmPayment(p.id as string, rider),
    code("PAYMENT_TIMED_OUT"),
  );
  assert.equal(payments[0].status, "TIMED_OUT");
  await assert.rejects(
    PaymentService.confirmPayment(p.id as string, rider),
    code("PAYMENT_INVALID_STATE"),
  );
});

test("only a SUCCEEDED payment can be refunded, once", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  await assert.rejects(
    PaymentService.refundPayment(p.id as string, "changed mind"),
    code("PAYMENT_INVALID_STATE"),
  );
  await PaymentService.confirmPayment(p.id as string, rider);
  const r = (await PaymentService.refundPayment(
    p.id as string,
    "changed mind",
  )) as Row;
  assert.equal(r.status, "REFUNDED");
  assert.equal(r.refundReason, "changed mind");
  assert.ok(r.refundedAt instanceof Date);
  await assert.rejects(
    PaymentService.refundPayment(p.id as string, "again"),
    code("PAYMENT_INVALID_STATE"),
  );
});

test("history: rider sees theirs, driver sees their rides', admin sees all", async () => {
  reset();
  await PaymentService.createPayment("ride-done", rider);
  assert.equal((await PaymentService.listPayments(rider)).length, 1);
  assert.equal((await PaymentService.listPayments(other)).length, 0);
  assert.equal((await PaymentService.listPayments(driver)).length, 1);
  assert.equal((await PaymentService.listPayments(admin)).length, 1);
});

test("a payment is only readable by its rider, the ride's driver, or an admin", async () => {
  reset();
  const p = (await PaymentService.createPayment("ride-done", rider)) as Row;
  for (const ok of [rider, driver, admin])
    assert.equal(
      ((await PaymentService.getPayment(p.id as string, ok)) as Row).id,
      p.id,
    );
  await assert.rejects(
    PaymentService.getPayment(p.id as string, other),
    code("AUTH_FORBIDDEN"),
  );
  await assert.rejects(
    PaymentService.getPayment("missing", admin),
    code("PAYMENT_NOT_FOUND"),
  );
});

// ---- HTTP wiring: role gates and validation ---------------------------

test("payment routes: auth, role gates and id validation over HTTP", async () => {
  const jwt = (await import("jsonwebtoken")).default;
  const { default: app } = await import("../src/app");
  const users: Record<string, Row> = {
    r1: { id: "r1", role: "RIDER" },
    d1: { id: "d1", role: "DRIVER" },
    a1: { id: "a1", role: "ADMIN" },
  };
  (db.user as unknown as { findUnique: unknown }).findUnique = async ({
    where,
  }: {
    where: { id: string };
  }) => users[where.id] ?? null;
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const call = async (
      method: string,
      path: string,
      as?: string,
      body?: unknown,
    ) => {
      const res = await fetch(base + path, {
        method,
        headers: {
          "content-type": "application/json",
          ...(as
            ? {
                authorization: `Bearer ${jwt.sign({ id: as }, process.env.ACCESS_TOKEN_SECRET!)}`,
              }
            : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return {
        status: res.status,
        json: (await res.json()) as { code?: string },
      };
    };
    const uuid = "123e4567-e89b-42d3-a456-426614174000";
    assert.equal((await call("GET", "/api/payment")).status, 401);
    assert.equal(
      (await call("POST", "/api/payment", "d1", { rideId: uuid })).status,
      403,
    );
    assert.equal(
      (await call("POST", `/api/payment/${uuid}/refund`, "r1", { reason: "x" }))
        .status,
      403,
    );
    assert.equal(
      (await call("POST", `/api/payment/${uuid}/confirm`, "d1")).status,
      403,
    );
    assert.equal(
      (await call("POST", "/api/payment", "r1", { rideId: "nope" })).status,
      400,
    );
    assert.equal(
      (await call("GET", "/api/payment/not-a-uuid", "r1")).status,
      400,
    );
    assert.equal(
      (await call("POST", `/api/payment/${uuid}/refund`, "a1", {})).status,
      400,
    );
    assert.equal((await call("GET", `/api/payment/${uuid}`, "r1")).status, 404);
    assert.equal((await call("GET", "/api/payment", "r1")).status, 200);
  } finally {
    server.close();
  }
});
