import { ApiProperty } from "@nestjs/swagger";
import { PostCoverImageDto } from "../../dto/post-cover-image.dto.js";
import { PostUserDto } from "../../dto/post-user.dto.js";
import { PublicPostCategoryDto } from "./post-category.dto.js";

export class PublicPostDto {

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  content?: string | null;

  @ApiProperty()
  category: PublicPostCategoryDto;

  @ApiProperty()
  coverImage?: PostCoverImageDto;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  author: PostUserDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  sortAt?: Date;

  @ApiProperty()
  isUpdating: boolean;

  @ApiProperty()
  priority: 'updating' | 'updated' | null;

  @ApiProperty()
  cursor: string;
}
