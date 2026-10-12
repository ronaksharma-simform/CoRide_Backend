# QA v1 · issue #19

Head tested: `8467ef7` (based on develop `b2b5010`)

| AC | Result | Evidence |
|---|---|---|
| Workflow runs on pull requests | pass | Actions run 38209857277, `build-lint` success |
| A TypeScript error fails the run | pass | `build-type-error.log`, `npm run build` exit 1 |
| A lint error fails the run | pass | `lint-error.log`, `npm run lint` exit 1 |
| npm dependencies are cached | pass | `cache: npm` in ci.yml, package-lock.json present, run log shows cache saved |

Clean branch: `npm ci && npx prisma generate && npm run build && npm run lint` all exit 0.
The failed SonarCloud and XHawk checks are external and not part of this ticket.
