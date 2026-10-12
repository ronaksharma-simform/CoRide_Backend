# QA v1 - issue #20

Head tested: 8987ee5 (npm ci, clean tree)

| AC | Command | Result |
|---|---|---|
| lint exits 0 | `npm run lint` | exit 0, no findings |
| format:check exits 0 | `npm run format:check` | exit 0, all files Prettier-clean |
| scripts listed in PROJECT.md | `docs/super-board/PROJECT.md:9-10` | lint, lint:fix, format, format:check listed |

Extra: `npm run lint:fix` exit 0 and left the tree unchanged.
