export type PageInfo = { skip: number; take: number; totalPages: number };

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;
const MAX_PAGE = 1_000_000;

/** Turns ?page=&limit= query values into Prisma skip/take plus a page count. */
export function getPageInfo(
  page: number,
  limit: number,
  total: number,
): PageInfo {
  // NaN (missing or bad query value) falls back to the defaults.
  const safeLimit = Number.isFinite(limit) ? Math.trunc(limit) : DEFAULT_LIMIT;
  // Capped so skip stays inside Prisma's 32-bit Int (1e6 * 50 < 2^31).
  const safePage = Number.isFinite(page)
    ? Math.min(Math.max(Math.trunc(page), 1), MAX_PAGE)
    : 1;
  const safeTotal = Number.isFinite(total) ? Math.max(total, 0) : 0;
  const take = Math.min(Math.max(safeLimit, 1), MAX_LIMIT);
  const skip = (safePage - 1) * take;
  const totalPages = Math.ceil(safeTotal / take);
  return { skip, take, totalPages };
}
