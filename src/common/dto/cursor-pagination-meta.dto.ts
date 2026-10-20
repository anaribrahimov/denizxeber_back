export class CursorPaginationMetaDto {
  total: number;
  limit: number;
  lastCursor: string | null;
  hasNextPage: boolean;
}
