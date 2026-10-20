import { ApiProperty } from "@nestjs/swagger";

export class PublicPostCategoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug?: string | null;

  @ApiProperty()
  languageCode: string;
}
