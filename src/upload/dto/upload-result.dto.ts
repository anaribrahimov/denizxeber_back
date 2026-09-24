import { ApiProperty } from "@nestjs/swagger";
import { UploadResponseDto } from "./upload-response.dto.js";

export class UploadResultDto {
  @ApiProperty()
  data: UploadResponseDto
}
