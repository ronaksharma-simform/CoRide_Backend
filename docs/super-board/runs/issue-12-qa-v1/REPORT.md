# QA v1 · issue #12 · `c9ff8e0`

| AC                                      | Result | Proof                                                                                        |
| --------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Log shows port in use when `PORT` unset | pass   | `node dist/server.js` logs `Server running on port 3000`; `test/server-port-default.test.ts` |
| Log shows `PORT` when set               | pass   | `PORT=4567` logs `Server running on port 4567`; `test/server-port-set.test.ts`               |
| `dotenv` imported before use            | pass   | `src/server.ts:1` `import "dotenv/config"`                                                   |

Commands: `npx prisma generate && npm run build` (clean), `node --import tsx --test test/server-port-*.test.ts` (2/2 pass).
Real run used the compiled `dist/server.js` with `NODE_ENV=production LOG_LEVEL=debug`.
