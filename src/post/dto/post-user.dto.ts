import { ApiProperty } from "@nestjs/swagger";

export class PostUserDto {
  @ApiProperty({
    required: false
  })
  id?: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName?: string;

  @ApiProperty()
  lastName?: string;
}
