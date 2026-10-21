import { Body, Controller, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { BannerService } from "./banner.service.js";
import { ApiDataResponse } from "../common/decorators/api-data-response.decorator.js";
import { BannerDto } from "./dto/banner.dto.js";
import { CreateBannerDto } from "./dto/create-banner.dto.js";
import { AppApiResponse } from "../common/interfaces/app-api-response.interface.js";
import { Roles } from "../auth/decorators/roles.decorator.js";

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
  public async create(
    @Body() createBannerDto: CreateBannerDto
  ): Promise<AppApiResponse<BannerDto>> {
    return {
      data: await this.bannerService.create(createBannerDto),
    }
  }
}
