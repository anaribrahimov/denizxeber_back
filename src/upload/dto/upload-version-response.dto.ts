import { ApiProperty } from "@nestjs/swagger";
import { UploadVersionType } from "../upload-version.entity.js";

export class UploadVersionResponseDto {

  @ApiProperty()
  id: number;

  @ApiProperty()
  version: UploadVersionType;

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
