# QA v2 - issue #20

Head tested: 717a9c7 plus the Prettier fix to the v1 report (npm ci, clean tree)

| AC                           | Command                            | Result                                          |
| ---------------------------- | ---------------------------------- | ----------------------------------------------- |
| lint exits 0                 | `npm run lint`                     | exit 0, no findings                             |
| format:check exits 0         | `npm run format:check`             | exit 1 on 717a9c7 (v1 report); exit 0 after fix |
| scripts listed in PROJECT.md | `docs/super-board/PROJECT.md:9-10` | lint, lint:fix, format, format:check listed     |

R2: the v1 report was not Prettier-clean. It is now formatted, and this v2 report is formatted too.
