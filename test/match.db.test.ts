/* eslint-disable @typescript-eslint/explicit-function-return-type */
// Runs the match endpoints over HTTP against a real PostGIS database.
// Skipped unless QA_DATABASE_URL points at an empty database with migrations applied.
import { test, after, before } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";

const url = process.env.QA_DATABASE_URL;
const skip = url ? false : "QA_DATABASE_URL not set";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = url ?? "postgresql://u:p@localhost:5432/d";
process.env.ACCESS_TOKEN_SECRET = "access-secret-0123456789";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret-0123456789";
process.env.VERIFICATION_TOKEN_SECRET = "verify-secret-0123456789";
process.env.VERIFICATION_BASE_URL = "http://localhost/verify?token=";
process.env.LOG_LEVEL = "info";
process.env.EMAIL_USER = "a@b.com";
process.env.EMAIL_PASSWORD = "x";

const { default: app } = await import("../src/app");
const { prisma } = await import("../src/config/prisma");

const server = app.listen(0);
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
after(async () => {
  server.close();
  await prisma.$disconnect();
});

type Res = { status: number; json: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
const call = async (path: string, as: string, body: unknown): Promise<Res> => {
  const token = jwt.sign({ id: as }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: 60,
  });
  const res = await fetch(base + path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
};

let n = 0;
const mkUser = async (role: "RIDER" | "DRIVER") => {
  n++;
  return prisma.user.create({
    data: {
      username: `u${n}${role}`,
      firstName: "A",
      lastName: "B",
      email: `u${n}${role}@x.com`,
      password: "x",
      phone: `900000${String(n).padStart(4, "0")}`,
      orgName: "o",
      role,
      gender: "MALE",
    },
  });
};
// A point `km` east of (0,0) along the equator (1 deg lng ~ 111.32 km).
const lng = (km: number) => km / 111.32;
const mkRide = async (
  providerId: string,
  srcKm: number,
  dstKm: number,
  opts: { seats?: number; hoursAhead?: number } = {},
): Promise<string> => {
  const v = await prisma.vehicle.create({
    data: {
      userId: providerId,
      company: "c",
      model: "m",
      color: "r",
      plateNumber: `P${Math.random().toString(36).slice(2, 10)}`,
      seatCapacity: 4,
    },
  });
  const seats = opts.seats ?? 2;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "Ride" ("providerId","vehicleId","sourceLabel","destinationLabel","route","departureTime","totalSeats","availableSeats")
    VALUES (${providerId}, ${v.id},
      ST_SetSRID(ST_MakePoint(${lng(srcKm)}, 0), 4326)::geography,
      ST_SetSRID(ST_MakePoint(${lng(dstKm)}, 0), 4326)::geography,
      ST_SetSRID(ST_MakeLine(ST_MakePoint(${lng(srcKm)}, 0), ST_MakePoint(${lng(dstKm)}, 0)), 4326)::geography,
      now() + (${opts.hoursAhead ?? 2} || ' hours')::interval, ${seats}, ${seats})
    RETURNING id`;
  return rows[0].id;
};
const req = (pickKm: number, dstKm: number) => ({
  pickup: { lat: 0, lng: lng(pickKm) },
  destination: { lat: 0, lng: lng(dstKm) },
});
const events = async (id: string) =>
  (
    await prisma.matchEvent.findMany({
      where: { requestId: id },
      orderBy: { createdAt: "asc" },
    })
  ).map((e) => e.type);
const seats = async (id: string) =>
  prisma.ride.findUniqueOrThrow({ where: { id } });

before(async () => {
  if (skip) return;
  await prisma.matchEvent.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.$executeRaw`DELETE FROM "Ride"`;
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
});

test("AC1: nearest of two in-range rides is assigned", { skip }, async () => {
  const rider = await mkUser("RIDER");
  const far = await mkRide((await mkUser("DRIVER")).id, 3, 20);
  const near = await mkRide((await mkUser("DRIVER")).id, 1, 20);
  const out = await call("/api/match", rider.id, req(0, 20));
  assert.equal(out.status, 201);
  assert.equal(out.json.data.status, "ASSIGNED");
  assert.equal(out.json.data.rideId, near);
  assert.notEqual(out.json.data.rideId, far);
  assert.deepEqual(await events(out.json.data.id), ["REQUESTED", "ASSIGNED"]);
});

test("AC4: no ride in range gives NO_DRIVERS with 201", { skip }, async () => {
  const rider = await mkUser("RIDER");
  const out = await call("/api/match", rider.id, req(500, 600));
  assert.equal(out.status, 201);
  assert.equal(out.json.data.status, "NO_DRIVERS");
  assert.equal(out.json.data.rideId, null);
  assert.deepEqual(await events(out.json.data.id), ["REQUESTED", "NO_DRIVERS"]);
});

test(
  "edge: ride near pickup but 10 km from destination is skipped",
  { skip },
  async () => {
    const rider = await mkUser("RIDER");
    await mkRide((await mkUser("DRIVER")).id, 200, 230);
    const out = await call("/api/match", rider.id, req(200, 250));
    assert.equal(out.json.data.status, "NO_DRIVERS");
  },
);

test(
  "edge: full, past-departure and own rides are skipped",
  { skip },
  async () => {
    const rider = await mkUser("RIDER");
    const d = await mkUser("DRIVER");
    await mkRide(d.id, 300, 330, { seats: 0 });
    await mkRide(d.id, 300, 330, { hoursAhead: -1 });
    // rider is also a provider here: must not match their own ride
    await mkRide(rider.id, 300, 330);
    const out = await call("/api/match", rider.id, req(300, 330));
    assert.equal(out.json.data.status, "NO_DRIVERS");
  },
);

test(
  "AC2/AC3: accept takes a seat, marks FULL at zero, logs ACCEPTED",
  { skip },
  async () => {
    const rider = await mkUser("RIDER");
    const driver = await mkUser("DRIVER");
    const ride = await mkRide(driver.id, 400, 430, { seats: 1 });
    const m = await call("/api/match", rider.id, req(400, 430));
    assert.equal(m.json.data.rideId, ride);
    const acc = await call("/api/match/accept", driver.id, {
      id: m.json.data.id,
    });
    assert.equal(acc.status, 200);
    assert.equal(acc.json.data.status, "ACCEPTED");
    const r = await seats(ride);
    assert.equal(r.availableSeats, 0);
    assert.equal(r.status, "FULL");
    assert.deepEqual(await events(m.json.data.id), [
      "REQUESTED",
      "ASSIGNED",
      "ACCEPTED",
    ]);
    const again = await call("/api/match/accept", driver.id, {
      id: m.json.data.id,
    });
    assert.equal(again.json.code, "MATCH_INVALID_STATE");
    assert.equal((await seats(ride)).availableSeats, 0);
  },
);

test(
  "AC2: reject reassigns to the next ride, never re-offers, then NO_DRIVERS",
  { skip },
  async () => {
    const rider = await mkUser("RIDER");
    const d1 = await mkUser("DRIVER");
    const d2 = await mkUser("DRIVER");
    const r1 = await mkRide(d1.id, 500, 530);
    const r2 = await mkRide(d2.id, 502, 530);
    const m = await call("/api/match", rider.id, req(500, 530));
    assert.equal(m.json.data.rideId, r1);
    const rej1 = await call("/api/match/reject", d1.id, { id: m.json.data.id });
    assert.equal(rej1.json.data.status, "ASSIGNED");
    assert.equal(rej1.json.data.rideId, r2);
    const rej2 = await call("/api/match/reject", d2.id, { id: m.json.data.id });
    assert.equal(rej2.json.data.status, "NO_DRIVERS");
    assert.deepEqual(await events(m.json.data.id), [
      "REQUESTED",
      "ASSIGNED",
      "REJECTED",
      "ASSIGNED",
      "REJECTED",
      "NO_DRIVERS",
    ]);
    assert.equal((await seats(r1)).availableSeats, 2);
  },
);

test(
  "cancel after accept frees the seat and reopens FULL ride",
  { skip },
  async () => {
    const rider = await mkUser("RIDER");
    const driver = await mkUser("DRIVER");
    const ride = await mkRide(driver.id, 600, 630, { seats: 1 });
    const m = await call("/api/match", rider.id, req(600, 630));
    await call("/api/match/accept", driver.id, { id: m.json.data.id });
    const c = await call("/api/match/cancel", rider.id, { id: m.json.data.id });
    assert.equal(c.json.data.status, "CANCELLED");
    const r = await seats(ride);
    assert.equal(r.availableSeats, 1);
    assert.equal(r.status, "ACTIVE");
    const twice = await call("/api/match/cancel", rider.id, {
      id: m.json.data.id,
    });
    assert.equal(twice.json.code, "MATCH_INVALID_STATE");
    assert.equal((await seats(ride)).availableSeats, 1);
  },
);

test("ownership and role checks", { skip }, async () => {
  const rider = await mkUser("RIDER");
  const other = await mkUser("RIDER");
  const driver = await mkUser("DRIVER");
  const stranger = await mkUser("DRIVER");
  await mkRide(driver.id, 700, 730);
  const m = await call("/api/match", rider.id, req(700, 730));
  const id = m.json.data.id;
  assert.equal(
    (await call("/api/match/accept", stranger.id, { id })).json.code,
    "RIDE_UNAUTHORIZED_ACTION",
  );
  assert.equal(
    (await call("/api/match/cancel", other.id, { id })).json.code,
    "RIDE_UNAUTHORIZED_ACTION",
  );
  assert.equal((await call("/api/match/accept", rider.id, { id })).status, 403);
  assert.equal((await call("/api/match", driver.id, req(0, 1))).status, 403);
  const unknown = await call("/api/match/accept", driver.id, {
    id: "00000000-0000-4000-8000-000000000000",
  });
  assert.equal(unknown.json.code, "MATCH_REQUEST_NOT_FOUND");
});

test(
  "two riders race for the last seat: one wins, seats never go negative",
  {
    skip,
  },
  async () => {
    const driver = await mkUser("DRIVER");
    const ride = await mkRide(driver.id, 800, 830, { seats: 1 });
    const a = await mkUser("RIDER");
    const b = await mkUser("RIDER");
    const ma = await call("/api/match", a.id, req(800, 830));
    const mb = await call("/api/match", b.id, req(800, 830));
    assert.equal(ma.json.data.rideId, ride);
    assert.equal(mb.json.data.rideId, ride);
    const [ra, rb] = await Promise.all([
      call("/api/match/accept", driver.id, { id: ma.json.data.id }),
      call("/api/match/accept", driver.id, { id: mb.json.data.id }),
    ]);
    const statuses = [ra.json.data?.status, rb.json.data?.status].sort();
    assert.deepEqual(statuses, ["ACCEPTED", "NO_DRIVERS"]);
    const r = await seats(ride);
    assert.equal(r.availableSeats, 0);
    assert.equal(
      await prisma.rideRequest.count({
        where: { rideId: ride, status: "ACCEPTED" },
      }),
      1,
    );
  },
);

test("validation: bad coordinates are 400", { skip }, async () => {
  const rider = await mkUser("RIDER");
  const out = await call("/api/match", rider.id, {
    pickup: { lat: 99, lng: 0 },
    destination: { lat: 0, lng: 0 },
  });
  assert.equal(out.status, 400);
});

test("double accept of the same request takes one seat", { skip }, async () => {
  const driver = await mkUser("DRIVER");
  const ride = await mkRide(driver.id, 900, 930, { seats: 2 });
  const rider = await mkUser("RIDER");
  const m = await call("/api/match", rider.id, req(900, 930));
  const id = m.json.data.id;
  await Promise.all([
    call("/api/match/accept", driver.id, { id }),
    call("/api/match/accept", driver.id, { id }),
  ]);
  assert.equal((await seats(ride)).availableSeats, 1);
});
