import { CursorPaginationMetaDto } from "../dto/cursor-pagination-meta.dto.js";
import { PaginationMetaDto } from "../dto/pagination-meta.dto.js";

export interface PaginatedResponse<T> {
  data: T[],
  meta: PaginationMetaDto
}

export interface CursorPaginatedResponse<T> {
  data: T[],
  meta: CursorPaginationMetaDto
}
