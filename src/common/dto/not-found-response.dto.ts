import { ApiProperty } from "@nestjs/swagger";

export class NotFoundResponseDto {

  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number = 404;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  path: string;
}
