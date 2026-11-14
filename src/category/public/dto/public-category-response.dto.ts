import { ApiProperty } from "@nestjs/swagger";
// import { Language } from "../../language/language.entity.js";

export class PublicCategoryResponseDto {
  
  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  // @ApiProperty()
  // language?: Language;

  @ApiProperty()
  rowNumber: number | null;
}
