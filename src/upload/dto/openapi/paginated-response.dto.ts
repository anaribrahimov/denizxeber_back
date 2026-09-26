import { ApiProperty } from "@nestjs/swagger";
import { UploadResponseDto } from "../upload-response.dto.js";
import { PaginationMetaDto } from "../../../common/dto/pagination-meta.dto.js";

export class OpenapiUploadPaginatedResponseDto {

  @ApiProperty()
  data: UploadResponseDto[];

  @ApiProperty()
  meta: PaginationMetaDto;
}
