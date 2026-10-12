# QA v3 - issue 6 (ride tracking and trip status)

Head under test: `bc860c1`
Command: `npm ci && npx prisma generate && npm run build && npm test` (node:test, prisma stubbed in memory; no database in this environment)
Result: 34 pass, 0 fail. `npm run build` clean.

| AC                                   | Result | Proof                                                                                                                             |
| ------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1 location updated in near real time | pass   | `test/tracking.http.test.ts` walk-through: POST location 201, `location` event fires, GET status shows it                         |
| 2 current status through the API     | pass   | same test: GET `/api/ride/:id/status` returns status, `currentLocation`, `statusHistory`                                          |
| 3 invalid payloads rejected cleanly  | pass   | bad lat/lng/types 400; client `recordedAt` fresh 201, stale or future 400 `RIDE_INVALID_LOCATION`                                 |
| 4 transitions logged                 | pass   | start and complete add history rows; skips 409; `PUT /api/ride` ACTIVE and FULL swap is logged; a lost race gives 409, no history |

Reviewer round 1 fixes re-checked: R1 (`tracking.services.ts:9-10` allows ACTIVE and FULL swap, `tracking.http.test.ts:229`), R2 (`ride.services.ts` status write and history row in one transaction, conditional on the read status, `tracking.http.test.ts:246`, `tracking.test.ts:91`). No new tests needed.

Not run: live database (the conditional UPDATE and transaction rollback are only exercised against the stub), real GPS clients.
Test gaps (not written): none High. Medium: rider coordinates not stored and any signed-in user can read a ride's location (R3, R4, disclosed follow-ups, need a booking model).
