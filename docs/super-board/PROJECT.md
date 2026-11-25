# CoRide Backend

Node.js + TypeScript API (Express-style layout) with Prisma. Base branch: `develop`.

- `src/routes`, `src/controllers`, `src/middlewares`, `src/validations`, `src/utils`, `src/types`, `src/config`
- `src/generated` — Prisma client (generated, don't edit)
- `prisma/schema.prisma` — database schema
- Build: `npm run build` (tsc). Dev: `npm run dev`.
- Commits follow commitlint; Prettier via lint-staged.
