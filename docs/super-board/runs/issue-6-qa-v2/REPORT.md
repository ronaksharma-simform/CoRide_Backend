# QA v2 - issue 6 (ride tracking and trip status)

Head under test: `44eb9d2`
Command: `npm ci && npx prisma generate && npm run build && npm test` (node:test, prisma stubbed in memory; no database in this environment)
Result: 30 pass, 0 fail. `npm run build` clean.

| AC                                   | Result | Proof                                                                                                                   |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1 location updated in near real time | pass   | `test/tracking.http.test.ts` walk-through: POST location 201, `location` event fires, GET status shows it               |
| 2 current status through the API     | pass   | same test: GET `/api/ride/:id/status` returns status, `currentLocation`, `statusHistory`                                |
| 3 invalid payloads rejected cleanly  | pass   | bad lat/lng/types 400; client `recordedAt` fresh 201, stale or future 400 `RIDE_INVALID_LOCATION` (v1 failure is fixed) |
| 4 transitions logged                 | pass   | start and complete each add a history row; skips and repeats 409; PUT cannot skip the lifecycle                         |

v1 failure (`recordedAt` string gave 500) is closed by `44eb9d2`: the service converts it to a Date.

Not run: live database, real GPS clients.
Test gaps (not written): none High. Rider location is readable by any signed-in user (stated Builder risk, no booking model yet).
