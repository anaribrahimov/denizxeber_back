import { PaginatedResult } from "../interfaces/paginated-result.interface.js";

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: total <= 1 ? 1 : Math.ceil(total / limit),
    },
  };
}
