# QA v1 - issue 6 (ride tracking and trip status)

Head under test: `7ae9eec`
Command: `npm test` (node:test, prisma stubbed in memory; no database in this environment)
Result: 29 pass, 1 fail. `npm run build` clean after `prisma generate`.

| AC                                   | Result | Proof                                                                                                                         |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 1 location updated in near real time | pass   | `test/tracking.http.test.ts` walk-through: POST location returns 201, the `location` event fires, GET status shows it         |
| 2 current status through the API     | pass   | same test: GET `/api/ride/:id/status` shows status, `currentLocation`, `statusHistory` to a rider                             |
| 3 invalid payloads rejected cleanly  | FAIL   | bad lat/lng/types give 400, but any `recordedAt` sent over HTTP gives 500 (`TypeError: recordedAt.getTime is not a function`) |
| 4 transitions logged                 | pass   | start and complete each add a history row; skips and repeats give 409; PUT cannot skip the lifecycle                          |

Cause of the AC 3 failure: `validateSchema` parses the body but never writes the result back to `req.body`, so `z.coerce.date()` has no effect and `recordedAt` stays an ISO string. `assertFreshFix` calls `.getTime()` on it.
Effect: a fresh client timestamp cannot be stored, and a stale or future one is a 500 instead of the intended 400 `RIDE_INVALID_LOCATION`. The unit test passed `Date` objects directly, so it never saw this.

Repro: `test/tracking.http.test.ts` "a client-sent recordedAt is accepted when fresh and rejected 400 when stale or in the future".
Fixed looks like: that test green (fresh 201, stale and future 400 `RIDE_INVALID_LOCATION`).

Not run: live database, real GPS clients.
Test gaps (not written): none High besides the failing one; rider location visibility to any signed-in user is a stated Builder risk.
