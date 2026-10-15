import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
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
import { ValidationErrorResponseDto } from "../common/dto/validation-error-response.dto.js";
import { NotFoundResponseDto } from "../common/dto/not-found-response.dto.js";
import { PostDto } from "./dto/post.dto.js";
import { PostQueryDto } from "./dto/post-query.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { UpdatePostDto } from "./dto/update-post.dto.js";
import { ValidationException } from "../common/exceptions/validation.exception.js";
import { LanguageQueryGuard } from "../common/guards/language-query.guard.js";
import { UserHasLanguages } from "../common/guards/user-has-languages.guard.js";
import { ApiDataResponse } from "../common/decorators/api-data-response.decorator.js";
import { ApiPaginatedResponse } from "../common/decorators/api-paginated-response.decorator.js";
import { AppApiResponse } from "../common/interfaces/app-api-response.interface.js";

@Controller('/posts')
@UseGuards(RolesGuard)
@Roles('Admin', 'User')
@UseGuards(UserHasLanguages)
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
  @ApiDataResponse(
    PostDto,
    HttpStatus.CREATED,
    '',
    '',
  )
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<AppApiResponse<PostDto>> {
    return {
      data: await this.postService.create(createPostDto, userPrincipal),
    };
  }

  @Get()
  @UseGuards(LanguageQueryGuard)
  @ApiPaginatedResponse(PostDto)
  public async findPaginated(
    @Query() queryDto: PostQueryDto,
    @CurrentLanguage() currentLang: Language,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<PaginatedResult<PostDto>> {
    return this.postService.findPaginated(queryDto, userPrincipal, currentLang);
  }

  @Get('/:id')
  @ApiDataResponse(
    PostDto,
    HttpStatus.OK,
    '',
    '',
  )
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    type: NotFoundResponseDto,
  })
  public async findOne(
    @Param('id') id: string,
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<AppApiResponse<PostDto>> {
    return {
      data: await this.postService.findOne(id, userPrincipal),
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
    @CurrentUser() userPrincipal: AuthUser
  ): Promise<void> {
    await this.postService.remove(id, userPrincipal);
  }

  @Patch('/:id')
  @ApiDataResponse(
    PostDto,
    HttpStatus.OK,
    '',
    '',
  )
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Post not found',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() userPrincipal: AuthUser,
  ): Promise<AppApiResponse<PostDto>> {
    if (
      dto.categoryId === undefined
      && dto.priorityId === undefined
      && dto.content === undefined
      && dto.coverImageId === undefined
      && dto.statusId === undefined
      && dto.title === undefined
    ) {
      throw new ValidationException({}, 'Nothing send to update');
    }
    return {
      data: await this.postService.update(id, dto, userPrincipal),
    }
  }
  
}
