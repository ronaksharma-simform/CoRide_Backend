# ADR 0001: Four-wheeler seat layout and seat booking

- Status: accepted
- Date: 2026-07-10
- Repos affected: `CoRide_Backend`, `CoRide_Frontend`

## Context

Ride providers publish a `Ride` on a registered `Vehicle` (`Vehicle.seatCapacity`
is the full seating count, driver included). Passengers need to see a
four-wheeler layout for a ride and book an exact seat, instead of just a seat
count. There was no model for "who sits where" on a ride.

## Decision

### Seat numbering & layout

- A ride's seats are numbered `1..ride.totalSeats` where `ride.totalSeats` is
  the vehicle's full capacity (driver included).
- **Seat 1 is always the driver** (the ride `providerId`). It is rendered in
  the layout but is **not bookable** by anyone.
- Seat 2 is the front passenger seat; seats `3..totalSeats` are rendered
  behind them. The frontend draws a four-wheeler top view: front row of two
  seats, then the remaining passenger seats in centered rows of up to three.
- A seat is in exactly one state: `driver`, `booked`, or `available`.

### Booking model

- New `RideBooking` table:
  - `@@unique([rideId, seatNumber])` — a seat can be booked once per ride.
  - `@@unique([rideId, userId])` — a user books at most one seat per ride.
  - `status` string defaulting to `CONFIRMED` (future states like `CANCELLED`
    can reuse this column without a migration).
- Booking rules enforced server-side in `RideService.bookSeat` inside a
  transaction:
  - ride must exist, be `ACTIVE`, and not `FULL`/`COMPLETED`/`CANCELLED`;
  - provider cannot join their own ride;
  - `seatNumber` must be an integer in `[1, totalSeats]`, and `seatNumber !== 1`;
  - `Ride.availableSeats` is atomically decremented and the ride is flipped to
    `FULL` when it reaches 0;
  - a `P2002` unique violation is mapped to `SEAT_ALREADY_BOOKED` so two
    concurrent bookings of the same seat cannot both succeed.

### Ride availability semantics

- `Ride.availableSeats` (set when the ride is created) is the authoritative
  counter of bookable passenger seats; seat 1 (driver) is not counted.
- When a provider offers a vehicle, the UI defaults
  `availableSeats = seatCapacity - 1` and `totalSeats = seatCapacity` so the
  drawn layout and the bookable count agree.

### API

Protected (JWT) endpoints added under `/api/ride`:

- `GET /api/ride/available` — ACTIVE rides with free seats, excluding the
  caller's own rides; includes denormalized `provider` and `vehicle` objects.
- `GET /api/ride/:rideId/layout` — seat states + vehicle info + caller's
  booking (if any).
- `POST /api/ride/:rideId/book-seat` with body `{ seatNumber }` — creates the
  booking and decrements availability.

## Consequences

- Race-safe exact-seat booking is enforced at the database level.
- Passenger flow: Find Ride → view layout → tap seat → confirm.
- No cancellation/changing-seat endpoint yet; a user who books is currently
  stuck with that seat on that ride (RIDE_ALREADY_JOINED). Follow-up work:
  booking cancellation endpoint and surfaced "my bookings" list.
- `RideBooking` rows cascade-delete when their ride is deleted.
