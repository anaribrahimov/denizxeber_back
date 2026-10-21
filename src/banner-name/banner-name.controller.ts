import { Controller, Get, HttpStatus } from "@nestjs/common";
import { BannerNameService } from "./banner-name.service.js";
import { ApiDataArrayResponse } from "../common/decorators/api-data-array-response.decorator.js";
import { BannerNameDto } from "./dto/banner-name.dto.js";
import { AppApiResponse } from "../common/interfaces/app-api-response.interface.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { ApiTags } from "@nestjs/swagger";

@Controller('/banner-names')
@ApiTags('Banner name')
export class BannerNameController {

  constructor(
    private readonly bannerNameService: BannerNameService,
  ) { }

  @Public()
  @Get()
  @ApiDataArrayResponse(BannerNameDto, HttpStatus.OK, '', '')
  public async findAll(): Promise<AppApiResponse<BannerNameDto[]>> {
    return {
      data: await this.bannerNameService.get()
    }
  }
}
