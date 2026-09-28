import { ApiProperty } from "@nestjs/swagger";
import { UploadType } from "../upload.entity.js";
import { UploadVersionResponseDto } from "./upload-version-response.dto.js";

export class UploadResponseDto {

  @ApiProperty()
  id: number;

  @ApiProperty()
  type: UploadType;

  @ApiProperty()
  fileOriginalName: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileKey: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSizeByte: number;

  @ApiProperty()
  fileWidth: number|null;

  @ApiProperty()
  fileHeight: number|null;

  @ApiProperty()
  durationSec: number|null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  preview: string;

  @ApiProperty()
  versions: UploadVersionResponseDto[];
}
