import { ApiProperty } from "@nestjs/swagger";
import { LanguageDto } from "../../language/dto/language.dto.js";

export class PostCategoryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
