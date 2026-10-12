# QA v1 · issue 22 · request log middleware

Head under test: `7e8d9d1`. Local tests: `npm test` (23/23 pass), `npm run build` clean.

| AC | Result | Proof |
|---|---|---|
| One line with method, path, status, ms | pass | `test/requestLogger.test.ts:32`; real app, NODE_ENV=development, `POST /nope 404 3.8ms` |
| No body, Authorization header or query string logged | pass | `test/requestLogger.test.ts:41`; real app run with secrets in body, header and query, none in the line |
| Silent when NODE_ENV=test | pass | `test/requestLogger.test.ts:56,63`; real app, NODE_ENV=test, no output |

No test gaps rated High. Not written: a test that the middleware is mounted in `app.ts` (checked by hand against the real app).
