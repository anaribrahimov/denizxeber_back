import { ApiProperty } from "@nestjs/swagger";

export class UploadVersionResponseDto {

  @ApiProperty()
  id: number;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileKey: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSizeByte: number|null;

  @ApiProperty()
  fileWidth: number|null;

  @ApiProperty()
  fileHeight: number|null;

  @ApiProperty()
  preview: string;
}
