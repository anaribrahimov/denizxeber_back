import { Controller, Get, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiDataArrayResponse } from "../../common/decorators/api-data-array-response.decorator.js";
import { CurrentLanguage } from "../../common/decorators/current-language.decorator.js";
import { Language } from "../../language/language.entity.js";
import { AppApiResponse } from "../../common/interfaces/app-api-response.interface.js";
import { CategoryService } from "../category.service.js";
import { LanguageGuard } from "../../common/guards/language.guard.js";
import { PublicCategoryResponseDto } from "./dto/public-category-response.dto.js";
import { Public } from "../../auth/decorators/public.decorator.js";

@Controller('/:lang/public/categories')
@UseGuards(LanguageGuard)
@ApiTags('Categories')
export class PublicCategoryController {

  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all categories for public' })
  @ApiDataArrayResponse(
    PublicCategoryResponseDto,
    HttpStatus.OK,
    '',
    ''
  )
  async findAll(
    @CurrentLanguage() language: Language
  ): Promise<AppApiResponse<PublicCategoryResponseDto[]>> {
    const categories = await this.categoryService.findAllPublic(language.id);
    return { data: categories };
  }
}
