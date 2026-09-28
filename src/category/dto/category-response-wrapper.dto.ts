import { ApiProperty } from "@nestjs/swagger";
import { CategoryResponseDto } from "./category-response.dto.js";

export class CategoryResponseWrapperDto {

  @ApiProperty()
  message?: string;

  @ApiProperty()
  data: CategoryResponseDto;
}
