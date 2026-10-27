import { BadRequestException, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, ParseIntPipe, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { UploadService } from "./upload.service.js";
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { commonUploadFilter, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, multerStorageConfig } from "../common/multer/multer.config.js";
import { FileCleanupInterceptor } from "../common/interceptors/file-cleanup.interceptor.js";
import { UploadResponseDto } from "./dto/upload-response.dto.js";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { UnauthenticatedResponseDto } from "../common/dto/unauthenticated-response.dto.js";
import { UnauthorizedResponseDto } from "../common/dto/unauthorized-response.dto.js";
import { PaginateUploadDto } from "./dto/paginate-upload.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { ApiDataResponse } from "../common/decorators/api-data-response.decorator.js";
import { AppApiResponse } from "../common/interfaces/app-api-response.interface.js";
import { ApiPaginatedResponse } from "../common/decorators/api-paginated-response.decorator.js";

@Controller('/uploads')
@UseGuards(RolesGuard)
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
  @ApiDataResponse( 
    UploadResponseDto,
    HttpStatus.CREATED,
    'File uploaded successfully',
    ''
  )
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
        .addMaxSizeValidator({ 
          maxSize: MAX_VIDEO_SIZE, 
          errorMessage: `File size must not exceed ${MAX_VIDEO_SIZE} byte` 
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @CurrentUser() userPrincipal: AuthUser,
  ): Promise<AppApiResponse<UploadResponseDto>> {
    // console.log('file', file);
    const isImage = file.mimetype.startsWith('image/');

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException(`Image size must not exceed ${MAX_IMAGE_SIZE} byte`);
    }

    const upload: UploadResponseDto = await this.uploadService.create(file, userPrincipal);

    return { data: upload };
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Find upload' })
  @ApiDataResponse(
    UploadResponseDto,
    HttpStatus.OK,
    'Returns upload data',
    ''
  )
  @ApiResponse({
    status: 404,
    description: 'Upload not found',
    type: CommonErrorDto,
  })
  @HttpCode(HttpStatus.OK)
  async find(
    @Param('id', ParseIntPipe) id: number
  ): Promise<AppApiResponse<UploadResponseDto>> {
    const upload = await this.uploadService.findById(id);
    return { data: upload };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete upload' })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Upload deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Upload not found',
    type: CommonErrorDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.uploadService.delete(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get uploads' })
  @ApiPaginatedResponse(UploadResponseDto)
  async findPaginated(
    @Query() query: PaginateUploadDto
  ): Promise<PaginatedResult<UploadResponseDto>> {
    return this.uploadService.findPaginated(query);
  }
}
