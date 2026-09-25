import { BadRequestException, Controller, HttpCode, HttpStatus, ParseFilePipeBuilder, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { UploadService } from "./upload.service.js";
import { ApiConsumes, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { commonUploadFilter, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, multerStorageConfig } from "../common/multer/multer.config.js";
import { FileCleanupInterceptor } from "../common/interceptors/file-cleanup.interceptor.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";
import { UploadResultDto } from "./dto/upload-result.dto.js";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";


@Controller('/admin/uploads')
export class UploadController {

  constructor(
    private readonly uploadService: UploadService,
  ) { }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Upload a new file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'File uploaded successfully',
    type: UploadResultDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request',
    type: CommonErrorDto
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable entity',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: 413,
    description: 'Payload too large',
    type: CommonErrorDto,
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerStorageConfig('image'),
      fileFilter: commonUploadFilter,
      limits: { fileSize: MAX_VIDEO_SIZE },
    }),
    FileCleanupInterceptor,
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp|gif|mp4|mpeg|mov|qt|webm)$/,
          skipMagicNumbersValidation: true,
          errorMessage: 'Suported file extensions are jpg, jpeg, png, webp, gif, mp4, mpeg, mov, qt, webm',
        })
        .addMaxSizeValidator({ maxSize: MAX_VIDEO_SIZE })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ): Promise<UploadResultDto> {
    // console.log('file', file);
    const isImage = file.mimetype.startsWith('image/');

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(`Image size must not exceed ${MAX_IMAGE_SIZE} byte`);
    }

    const upload: UploadResponseDto = await this.uploadService.create(file);

    return { data: upload };
  }
}
