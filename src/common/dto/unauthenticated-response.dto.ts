import { ApiProperty } from "@nestjs/swagger";

export class UnauthenticatedResponseDto {

  @ApiProperty()
  message: string;

  @ApiProperty()
  statusCode: number = 401;

  @ApiProperty()
  timestamp: Date;

  @ApiProperty()
  path: string;
}
