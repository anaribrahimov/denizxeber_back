import { PaginatedResult } from "../../common/interfaces/paginated-result.interface.js";
import { PostDto } from "./post.dto.js";

export class PostPaginatedResponseDto implements PaginatedResult<PostDto> {
  data: PostDto[];
  meta: { 
    total: number; 
    page: number; 
    limit: number; 
    totalPages: number; 
  };
}
