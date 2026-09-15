import { ApiProperty } from "@nestjs/swagger";

export class UnauthorizedResponseDto {

  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number = 403;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  path: string;
}
