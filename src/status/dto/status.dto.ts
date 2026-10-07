import { ApiProperty } from "@nestjs/swagger";

export class StatusDto {
  @ApiProperty()
  id: number;
  
  @ApiProperty()
  name: string;
}
