import { ApiProperty } from "@nestjs/swagger";
import { PostCategoryDto } from "./post-category.dto.js";
import { PostUserDto } from "./post-user.dto.js";
import { PostCoverImageDto } from "./post-cover-image.dto.js";

export class PostDto {

  @ApiProperty()
  id: string;

  @ApiProperty()
  category: PostCategoryDto;

  @ApiProperty()
  isUpdating: boolean;

  @ApiProperty()
  status: string;

  @ApiProperty()
  author: PostUserDto | null;

  @ApiProperty({
    type: () => PostUserDto,
  })
  lastUpdatedBy?: PostUserDto;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  sortAt: Date;

  @ApiProperty()
  url: string;

  @ApiProperty({
    type: () => PostCoverImageDto,
    nullable: true,
  })
  coverImage: PostCoverImageDto | null;
}
