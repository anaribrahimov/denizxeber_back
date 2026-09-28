import { ApiProperty } from "@nestjs/swagger";

export class CommonErrorDto {

  @ApiProperty()
  message: string;

  @ApiProperty()
  error: string;

  @ApiProperty()
  statusCode: number|null;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  path: string;
}
