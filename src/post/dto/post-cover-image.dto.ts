import { ApiProperty } from "@nestjs/swagger";

export class PostCoverImageDto {
  @ApiProperty()
  originalUrl: string;

  @ApiProperty()
  thumbnailUrl: string | null;
}
