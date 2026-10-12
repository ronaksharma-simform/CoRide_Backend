# QA v1, issue #11 @ 15d4553 (base develop 4a12840)

Setup: `npm ci`, `npx prisma generate` (client is gitignored), dummy env vars.

| AC                                   | Command                                 | Result                                                 |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------ |
| 1 `npm run build` exits 0            | `npm run build`                         | exit 0, `dist/package.json` = `{ "type": "commonjs" }` |
| 2 `npm start` boots, `GET /temp` 200 | `PORT=4711 npm start`; `curl /temp`     | boots; `/temp` 404, `/health` 401                      |
| 3 `npm run dev` works                | `PORT=4712 npm run dev`; `curl /health` | boots; 401                                             |
| suite                                | `npm test`                              | 20/20 pass, incl. `test/build.start.test.ts`           |

`/temp` is not defined anywhere in `src/` (grep `temp|health`: only `/health` in `src/app.ts:24`).
The Builder's test asserts `/health` 401 instead; that is not AC2 as written.
