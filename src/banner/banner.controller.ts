import { Body, Controller, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
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

@Controller('/banners')
@UseGuards(RolesGuard)
@ApiTags('Banners')
export class BannerController {

  constructor(
    private readonly bannerService: BannerService,
  ) { }

  @Post()
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

  @Patch('/:id')
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
    description: 'Post not found',
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
}
