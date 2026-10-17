import { Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentLanguage } from "../../common/decorators/current-language.decorator.js";
import { Language } from "../../language/language.entity.js";
import { PostService } from "../post.service.js";
import { Public } from "../../auth/decorators/public.decorator.js";
import { PublicPostDto } from "./dto/public-post.dto.js";
import { ApiDataArrayResponse } from "../../common/decorators/api-data-array-response.decorator.js";
import { AppApiResponse } from "../../common/interfaces/app-api-response.interface.js";
import { ApiDataResponse } from "../../common/decorators/api-data-response.decorator.js";
import { CommonErrorDto } from "../../common/dto/common-error.dto.js";
import { LanguageQueryGuard } from "../../common/guards/language-query.guard.js";
import { LangCodeQueryDto } from "../../common/dto/lang-code-query.dto.js";
import { PublicPostQueryDto } from "./dto/public-post-query.dto.js";
import { ApiCursorPaginatedResponse } from "../../common/decorators/api-cursor-paginated-response.decorator.js";
import { CategoryAndSliderPostsResponseDto } from "./dto/category-slider-posts-response.dto.js";

@Controller('/public/posts')
@ApiTags('Posts')
export class PublicPostController {

  constructor(
    private readonly postService: PostService,
  ) {}

  @Get()
  @Public()
  @UseGuards(LanguageQueryGuard)
  @ApiCursorPaginatedResponse(PublicPostDto)
  @HttpCode(HttpStatus.OK)
  async get(
    @Query() dto: PublicPostQueryDto,
    @CurrentLanguage() currentLang: Language | null,
  ) {
    return this.postService.findPostCursorPaginated(dto, currentLang);
  }

  @Get('/todays-most-read')
  @Public()
  @UseGuards(LanguageQueryGuard)
  @ApiDataArrayResponse(
    PublicPostDto,
    HttpStatus.OK,
    '',
    '',
  )
  @HttpCode(HttpStatus.OK)
  async todaysMostRead(
    @Query() dto: LangCodeQueryDto,
    @CurrentLanguage() currentLang: Language,
  ): Promise<AppApiResponse<PublicPostDto[]>> {
    return {
      data: await this.postService.todaysMostRead(currentLang),
    }
  }

  @Get('/top-3-posts-per-category-slider-posts-other-posts')
  @Public()
  @UseGuards(LanguageQueryGuard)
  @ApiDataArrayResponse(
    CategoryAndSliderPostsResponseDto,
    HttpStatus.OK,
    '',
    '',
  )
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    summary: 'Post not found',
    type: CommonErrorDto
  })
  @HttpCode(HttpStatus.OK)
  public async getTop3PostsPerCategoryAndSliderPostsAndOtherPosts(
    @Query() dto: LangCodeQueryDto,
    @CurrentLanguage() currentLang: Language,
  ): Promise<AppApiResponse<CategoryAndSliderPostsResponseDto>> {
    return {
      data: await this.postService.getTop3PostsPerCategoryAndSliderPostsAndOtherPosts(currentLang),
    }
  }

  @Get('/:postSlug')
  @Public()
  @ApiDataResponse(
    PublicPostDto,
    HttpStatus.OK,
    '',
    '',
  )
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    summary: 'Post not found',
    type: CommonErrorDto
  })
  @HttpCode(HttpStatus.OK)
  async findPost(
    @Param('postSlug') postSlug: string
  ): Promise<AppApiResponse<PublicPostDto>> {
    return { 
      data: await this.postService.findBySlugForPublic(postSlug),
    }
  }

}
