export type PageInfo = { skip: number; take: number; totalPages: number };

const MAX_LIMIT = 50;

/** Turns ?page=&limit= query values into Prisma skip/take plus a page count. */
export function getPageInfo(
  page: number,
  limit: number,
  total: number,
): PageInfo {
  const take = Math.min(Math.max(limit, 1), MAX_LIMIT);
  const skip = page * take;
  const totalPages = Math.ceil(total / take);
  return { skip, take, totalPages };
}
