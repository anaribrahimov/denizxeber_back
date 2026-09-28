import { ApiProperty } from "@nestjs/swagger";
// import { Language } from "../../language/language.entity.js";

export class CategoryResponseDto {

  @ApiProperty()
  id: number;
  
  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  userId?: number;

  // @ApiProperty()
  // language?: Language;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt?: Date;

  @ApiProperty()
  isActive: boolean;
}
