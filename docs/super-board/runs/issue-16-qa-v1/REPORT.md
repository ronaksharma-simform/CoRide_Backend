# QA report: issue #16 (v1) - head ceebbdc

Local tests: npm ci && npx prisma generate && npm run build && npm test
Result: build exit 0; 31 tests, 31 pass, 0 fail.

| AC                                                | Result                | Proof                                                                                           |
| ------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| Missing DATABASE_URL stops startup naming the key | pass                  | test/env.test.ts:41; manual run with empty env exits 1 listing `DATABASE_URL: Invalid input...` |
| PORT defaults to 3000 and must be a number        | pass                  | test/env.test.ts:47, :53, :59                                                                   |
| No other file reads process.env directly          | pass (scoped to src/) | test/env.test.ts:66; src/ has one read, src/config/env.ts:114                                   |

Test gaps (not written):

- Medium: prisma.config.ts:9 reads DATABASE_URL directly. Outside src/ and kept on purpose by the builder (Prisma CLI must run without the other keys). The AC wording says "no other file", so Eric may want this stated in the ticket.
- Low: no test for out-of-range PORT (0, 70000), though the schema rejects them.
