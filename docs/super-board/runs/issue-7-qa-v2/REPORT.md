# QA v2 for #7 (PR #23, head eff6a09)

- npm ci, prisma generate, npm run build: pass
- prisma migrate deploy on empty PostGIS 16-3.4 (template0 db): pass; migrate diff vs schema: no drift
- npm test with QA_DATABASE_URL set: 41 pass, 0 fail (28 unit, 13 DB)
- test/match.db.test.ts x3 runs: 13/13 each; v1 "double accept" now passes

Test gaps closed (High, from v1 note that reject and cancel share the pattern):

- double cancel of an accepted request frees one seat, not two
- double reject records one REJECTED event
  Both fail with the FOR UPDATE line removed (3 fail total incl. double accept), pass with it.

Local: QA_DATABASE_URL=postgresql://postgres:qa@localhost:PORT/DB npm test (db created from template0, migrations applied)
