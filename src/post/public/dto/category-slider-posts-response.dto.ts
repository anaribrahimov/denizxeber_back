import { ApiProperty } from "@nestjs/swagger";
import { PublicPostDto } from "./public-post.dto.js";

export class CategoryPostItem {

  categoryId: number;
  
  posts: PublicPostDto[];
}

export class CategoryAndSliderPostsResponseDto {

  @ApiProperty()
  sliderPosts: PublicPostDto[];

  otherPosts: PublicPostDto[];

  top3PostsPerCategory: CategoryPostItem[];
}
