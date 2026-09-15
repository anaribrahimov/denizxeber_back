import { ApiProperty } from "@nestjs/swagger";
import { CategoryResponseDto } from "./category-response.dto.js";

export class CategoriesResponseWrapperDto {

  @ApiProperty()
  data: CategoryResponseDto[];
}
