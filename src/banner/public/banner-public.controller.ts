import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BannerService } from "../banner.service.js";
import { Public } from "../../auth/decorators/public.decorator.js";
import { LanguageQueryGuard } from "../../common/guards/language-query.guard.js";
import { ApiDataArrayResponse } from "../../common/decorators/api-data-array-response.decorator.js";
import { LangCodeQueryDto } from "../../common/dto/lang-code-query.dto.js";
import { CurrentLanguage } from "../../common/decorators/current-language.decorator.js";
import { LanguageDto } from "../../language/dto/language.dto.js";
import { BannerResponsePublicDto } from "./dto/banner-response-public.dto.js";
import { AppApiResponse } from "../../common/interfaces/app-api-response.interface.js";

@Controller('/public/banners')
@ApiTags('Banners')
export class BannerPublicController {

  constructor(
    private readonly bannerService: BannerService,
  ) { }

  @Get()
  @Public()
  @UseGuards(LanguageQueryGuard)
  @ApiDataArrayResponse(BannerResponsePublicDto, HttpStatus.OK, '', '')
  @HttpCode(HttpStatus.OK)
  public async findAll(
    @Query() queryDto: LangCodeQueryDto,
    @CurrentLanguage() currentLanguage: LanguageDto,
  ): Promise<AppApiResponse<BannerResponsePublicDto[]>> {
    return {
      data: await this.bannerService.findAllPublic(currentLanguage.id),
    }
  }
}
