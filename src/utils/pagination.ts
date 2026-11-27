export type PageInfo = { skip: number; take: number; totalPages: number };

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

/** Turns ?page=&limit= query values into Prisma skip/take plus a page count. */
export function getPageInfo(
  page: number,
  limit: number,
  total: number,
): PageInfo {
  // NaN (missing or bad query value) falls back to the defaults.
  const safeLimit = Number.isFinite(limit) ? Math.trunc(limit) : DEFAULT_LIMIT;
  const safePage = Number.isFinite(page) ? Math.max(Math.trunc(page), 1) : 1;
  const take = Math.min(Math.max(safeLimit, 1), MAX_LIMIT);
  const skip = (safePage - 1) * take;
  const totalPages = Math.ceil(total / take);
  return { skip, take, totalPages };
}
