import { ApiProperty } from "@nestjs/swagger";
import { UploadType } from "../upload.entity.js";

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
  filePath: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSizeInBytes: string;

  @ApiProperty()
  fileWidth: number|null;

  @ApiProperty()
  fileHeight: number|null;

  @ApiProperty()
  thumbPath: string|null;

  @ApiProperty()
  thumbWidth: number|null;

  @ApiProperty()
  thumbHeight: number|null;

  @ApiProperty()
  thumbSizeInBytes: number|null;

  @ApiProperty()
  durationInSec: number|null;

  @ApiProperty()
  createdAt: Date;
}
