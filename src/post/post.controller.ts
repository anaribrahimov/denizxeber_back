import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { PostService } from "./post.service.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";
import { CreatePostDto } from "./dto/create-post.dto.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { CurrentLanguage } from "../common/decorators/current-language.decorator.js";
import { Language } from "../language/language.entity.js";
import { LanguageGuard } from "../common/guards/language.guard.js";
import { ValidationErrorResponseDto } from "../common/dto/validation-error-response.dto.js";
import { NotFoundResponseDto } from "../common/dto/not-found-response.dto.js";
import { PostDto } from "./dto/post.dto.js";
import { PostQueryDto } from "./dto/post-query.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { UpdatePostDto } from "./dto/update-post.dto.js";
import { ValidationException } from "../common/exceptions/validation.exception.js";
import { PostResponseDto } from "./dto/post-response.dto.js";
import { PostPaginatedResponseDto } from "./dto/post-paginated-response.dto.js";

@Controller('/:lang/posts')
@UseGuards(LanguageGuard)
@UseGuards(RolesGuard)
@Roles('Admin', 'User')
@ApiTags('Posts')
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
export class PostController {

  constructor(
    private readonly postService: PostService,
  ) {}

  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: PostResponseDto
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() userPrincipal: AuthUser,
    @CurrentLanguage() lang: Language
  ): Promise<PostResponseDto> {
    return {
      data: await this.postService.create(createPostDto, lang, userPrincipal),
    };
  }

  @Get()
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated posts list',
    type: PostPaginatedResponseDto,
  })
  public async findPaginated(
    @Query() queryDto: PostQueryDto,
    @CurrentLanguage() lang: Language,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<PaginatedResult<PostDto>> {
    return this.postService.findPaginated(queryDto, lang.id);
  }

  @Get('/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post found successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    type: NotFoundResponseDto,
  })
  public async findOne(
    @Param('id') id: string,
    @CurrentLanguage() lang: Language,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<PostResponseDto> {
    return {
      data: await this.postService.findOne(id, lang.id),
    };
  }

  @Delete('/:id')
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Post successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('id') id: string,
    @CurrentLanguage() lang: Language,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<void> {
    await this.postService.remove(id, lang.id, userPrincipal.userId);
  }

  @Patch('/:id')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post successfully updated',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentLanguage() lang: Language,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<PostResponseDto> {
    if (
      dto.categoryId === undefined
      && dto.isUpdating === undefined
      && dto.content === undefined
      && dto.coverImageId === undefined
      && dto.statusId === undefined
      && dto.title === undefined
    ) {
      throw new ValidationException({}, 'Nothing send to update');
    }
    return {
      data: await this.postService.update(id, dto, lang.id, userPrincipal.userId),
    }
  }
  
}
