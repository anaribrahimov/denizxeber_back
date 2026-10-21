import { ApiProperty } from "@nestjs/swagger";

export class BannerCoverImageDto {

  @ApiProperty()
  originalUrl: string;

  @ApiProperty()
  thumbnailUrl: string | null;
}
