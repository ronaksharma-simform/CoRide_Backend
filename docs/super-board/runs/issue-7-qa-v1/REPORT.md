# QA v1 for #7 (PR #23, head 52c60d7)

- npm run build: pass
- npm test (no DB): 28 pass
- prisma migrate deploy on empty PostGIS 16-3.4: pass; migrate diff vs schema: no drift
- QA_DATABASE_URL=<postgis> node --import tsx --test test/match.db.test.ts: 10 pass, 1 fail

FAIL: double accept of the same request takes one seat -> availableSeats 0, expected 1 (3/3 runs)
