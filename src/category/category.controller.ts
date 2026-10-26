import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CategoryService } from "./category.service.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { UnauthenticatedResponseDto } from "../common/dto/unauthenticated-response.dto.js";
import { UnauthorizedResponseDto } from "../common/dto/unauthorized-response.dto.js";
import { ValidationErrorResponseDto } from "../common/dto/validation-error-response.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";
import { NotFoundResponseDto } from "../common/dto/not-found-response.dto.js";
import { CurrentLanguage } from "../common/decorators/current-language.decorator.js";
import { Language } from "../language/language.entity.js";
import { LanguageGuard } from "../common/guards/language.guard.js";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";
import { ApiDataResponse } from "../common/decorators/api-data-response.decorator.js";
import { CategoryResponseDto } from "./dto/category-response.dto.js";
import { AppApiResponse } from "../common/interfaces/app-api-response.interface.js";
import { ApiDataArrayResponse } from "../common/decorators/api-data-array-response.decorator.js";

@Controller('/:lang/categories')
@UseGuards(RolesGuard)
@UseGuards(LanguageGuard)
@Roles('Admin', 'User')
@ApiTags('Categories')
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
  type: UnauthenticatedResponseDto,
})
@ApiResponse({
  status: 403,
  description: 'Forbidden',
  type: UnauthorizedResponseDto,
})
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiDataResponse(
    CategoryResponseDto,
    HttpStatus.CREATED,
    'Category successfully created',
    ''
  )
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Wrong language',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() authUser: AuthUser,
    @CurrentLanguage() language: Language,
  ): Promise<AppApiResponse<CategoryResponseDto>> {
    return {
      data: await this.categoryService.create(dto, authUser.userId, language),
    };
  }

  @Patch('/:id')
  @ApiDataResponse(
    CategoryResponseDto,
    HttpStatus.OK,
    'Category successfully updated',
    ''
  )
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Category not found or wrong language',
    type: NotFoundResponseDto,
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentLanguage() language: Language,
    @CurrentUser() authUser: AuthUser,
  ): Promise<AppApiResponse<CategoryResponseDto>> {
    const category = await this.categoryService.update(id, dto, language.id, authUser);
    return {
      message: 'Category successfully updated',
      data: category,
    }
  }

  @Delete('/:id')
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Category not found or wrong language',
    type: NotFoundResponseDto,
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Conflict to delete',
    type: CommonErrorDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentLanguage() language: Language,
  ): Promise<void> {
    await this.categoryService.remove(id, language.id);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get category' })
  @ApiDataResponse(
    CategoryResponseDto,
    HttpStatus.OK,
    '',
    ''
  )
  @ApiResponse({ 
    status: 404, 
    description: 'Category not found or wrong language',
    type: NotFoundResponseDto,
  })
  async find(
    @Param('id', ParseIntPipe) id: number,
    @CurrentLanguage() language: Language,
  ): Promise<AppApiResponse<CategoryResponseDto>> {
    return { 
      data: await this.categoryService.findOne(id, language.id),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiDataArrayResponse(
    CategoryResponseDto,
    HttpStatus.OK,
    '',
    ''
  )
  @ApiResponse({ 
    status: 400,
    description: 'Bad request',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND, 
    description: 'Wrong language',
    type: NotFoundResponseDto,
  })
  async findAll(@CurrentLanguage() language: Language): Promise<AppApiResponse<CategoryResponseDto[]>> {
    const categories = await this.categoryService.findAll(language.id);
    return { data: categories };
  }
}
