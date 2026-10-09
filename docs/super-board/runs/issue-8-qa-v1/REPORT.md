# QA v1 - issue 8 (auth and authorization)

Command: `npm test` (node:test, prisma user lookup stubbed; no database in this environment)
Result: 18 pass, 0 fail. `npm run build` and `eslint` clean after `prisma generate`.

| AC                                     | Result | Proof                                                                                                                        |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Sign up and log in                     | pass   | login returns 200 and an access token that passes /health; ADMIN self-signup 400; unverified login AUTH_ACCOUNT_NOT_VERIFIED |
| Authenticated requests validated       | pass   | missing, garbage, expired, deleted-user tokens all 401                                                                       |
| Unauthorized rejected with clear codes | pass   | AUTH_TOKEN_MISSING, AUTH_INVALID_TOKEN, TOKEN_EXPIRED, AUTH_FORBIDDEN, AUTH_INVALID_CREDENTIALS over HTTP                    |
| Roles enforced                         | pass   | rider gets 403 on all 6 vehicle/ride write routes; driver passes the gate                                                    |

Not run: real registration (needs DB + SMTP), refresh-token round trip with cookie.
