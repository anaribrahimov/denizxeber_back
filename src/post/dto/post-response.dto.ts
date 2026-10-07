import { ApiProperty } from "@nestjs/swagger";
import { PostDto } from "./post.dto.js";

export class PostResponseDto {
  @ApiProperty()
  data: PostDto
}
