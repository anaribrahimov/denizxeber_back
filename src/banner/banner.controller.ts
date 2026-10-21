import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { BannerService } from "./banner.service.js";
import { ApiDataResponse } from "../common/decorators/api-data-response.decorator.js";
import { BannerDto } from "./dto/banner.dto.js";
import { CreateBannerDto } from "./dto/create-banner.dto.js";
import { AppApiResponse } from "../common/interfaces/app-api-response.interface.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";
import { ValidationErrorResponseDto } from "../common/dto/validation-error-response.dto.js";
import { NotFoundResponseDto } from "../common/dto/not-found-response.dto.js";
import { UpdateBannerDto } from "./dto/update-banner.dto.js";
import { ValidationException } from "../common/exceptions/validation.exception.js";
import { ApiDataArrayResponse } from "../common/decorators/api-data-array-response.decorator.js";
import { LangCodeQueryDto } from "../common/dto/lang-code-query.dto.js";
import { LanguageQueryGuard } from "../common/guards/language-query.guard.js";
import { CurrentLanguage } from "../common/decorators/current-language.decorator.js";
import { LanguageDto } from "../language/dto/language.dto.js";
import { Public } from "../auth/decorators/public.decorator.js";

@Controller('/banners')
@ApiTags('Banners')
export class BannerController {

  constructor(
    private readonly bannerService: BannerService,
  ) { }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiDataResponse(BannerDto, HttpStatus.CREATED, '', '')
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() createBannerDto: CreateBannerDto
  ): Promise<AppApiResponse<BannerDto>> {
    return {
      data: await this.bannerService.create(createBannerDto),
    }
  }

  @Get()
  @Public()
  @UseGuards(LanguageQueryGuard)
  @ApiDataArrayResponse(BannerDto, HttpStatus.OK, '', '')
  @HttpCode(HttpStatus.CREATED)
  public async findAll(
    @Query() queryDto: LangCodeQueryDto,
    @CurrentLanguage() currentLanguage: LanguageDto,
  ): Promise<AppApiResponse<BannerDto[]>> {
    return {
      data: await this.bannerService.findAll(currentLanguage.id),
    }
  }

  @Patch('/:id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiDataResponse(BannerDto, HttpStatus.OK, '', '')
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
    type: NotFoundResponseDto,
  })
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto
  ): Promise<AppApiResponse<BannerDto>> {
    if (
      !dto.bannerNameId
      && !dto.coverImageId
      && dto.link === undefined
    ) {
      throw new ValidationException({}, 'Nothing was sent to update');
    }
    
    return {
      data: await this.bannerService.update(id, dto),
    }
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Banner successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Banner not found',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.bannerService.remove(id);
  }
}
