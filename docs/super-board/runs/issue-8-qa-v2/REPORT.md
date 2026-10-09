# QA v2 - issue 8 (auth and authorization), rebuild round

Head under test: `8cb8501`
Command: `npm test` (node:test, prisma user lookup stubbed; no database in this environment)
Result: 19 pass, 0 fail. `npm run build` and `eslint` clean after `prisma generate`.

| Check                                  | Result | Proof                                                                                                                   |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Prior AC 1-4 still hold                | pass   | same v1 tests green on the rebuilt head                                                                                 |
| R1 login after logout returns a cookie | pass   | `test/auth.http.test.ts` "login after logout sets a usable refresh cookie" asserts a non-empty cookie and a 200 refresh |
| R2 regression test is real             | pass   | with `auth.services.ts` reverted to `HEAD~1` that test fails (18 pass, 1 fail); with the fix it passes                  |
| R3 legacy `USER` roles                 | pass   | PR `solution` block gives the operator `UPDATE` statement; no migration shipped, as stated                              |

Not run: real registration (needs database and SMTP).
Test gaps (not written): none High; refresh-token rotation on reuse is Medium.
