import { BadRequestException, Controller, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, ParseIntPipe, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UploadService } from "./upload.service.js";
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { commonUploadFilter, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, multerStorageConfig } from "../common/multer/multer.config.js";
import { FileCleanupInterceptor } from "../common/interceptors/file-cleanup.interceptor.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";
import { UploadResultDto } from "./dto/upload-result.dto.js";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { LanguageGuard } from "../common/guards/language.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { UnauthenticatedResponseDto } from "../common/dto/unauthenticated-response.dto.js";
import { UnauthorizedResponseDto } from "../common/dto/unauthorized-response.dto.js";


@Controller('/admin/:lang/uploads')
@UseGuards(RolesGuard)
@UseGuards(LanguageGuard)
@Roles('Admin', 'User')
@ApiTags('Uploads')
@ApiResponse({
  status: 401,
  description: 'Unauthenticated',
  type: UnauthenticatedResponseDto,
})
@ApiResponse({
  status: 403,
  description: 'Unauthorized',
  type: UnauthorizedResponseDto,
})
export class UploadController {

  constructor(
    private readonly uploadService: UploadService,
  ) { }

  @Post()
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

  @Get('/:id')
  @ApiOperation({ summary: 'Find upload' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns upload data',
    type: UploadResultDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Upload not found',
    type: CommonErrorDto,
  })
  @HttpCode(HttpStatus.OK)
  async find(@Param('id', ParseIntPipe) id: number): Promise<UploadResultDto> {
    const upload = await this.uploadService.findById(id);
    return { data: upload };
  }

}
