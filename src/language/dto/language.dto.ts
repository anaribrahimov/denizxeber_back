import { ApiProperty } from "@nestjs/swagger";

export class LanguageDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}
