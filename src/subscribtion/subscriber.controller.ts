import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Query, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubscriberService } from "./subscriber.service.js";
import { Public } from "../auth/decorators/public.decorator.js";
import { CreateSubscriberDto } from "./dto/create-subscriber.dto.js";
import { ValidationErrorResponseDto } from "../common/dto/validation-error-response.dto.js";
import { GetSubscribersDto } from "./dto/get-subscribers.dto.js";
import { CurrentLanguage } from "../common/decorators/current-language.decorator.js";
import { LanguageDto } from "../language/dto/language.dto.js";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { LanguageQueryGuard } from "../common/guards/language-query.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { UserHasLanguages } from "../common/guards/user-has-languages.guard.js";
import { ApiPaginatedResponse } from "../common/decorators/api-paginated-response.decorator.js";
import { SubscriberDto } from "./dto/subscriber.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { NotFoundResponseDto } from "../common/dto/not-found-response.dto.js";

@Controller('/subscribers')
@ApiTags('Subscribers')
export class SubscriberController {

  constructor(
    private readonly subscriberService: SubscriberService,
  ) { }

  @Public()
  @Post()
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully subscribed',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body() dto: CreateSubscriberDto,
  ): Promise<void> {
    await this.subscriberService.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('Admin', 'User')
  @UseGuards(LanguageQueryGuard)
  @UseGuards(UserHasLanguages)
  @ApiPaginatedResponse(SubscriberDto)
  public async findPaginated(
    @Query() dto: GetSubscribersDto,
    @CurrentLanguage() currentLang: LanguageDto,
    @CurrentUser() userPrincipal: AuthUser,
  ): Promise<PaginatedResult<SubscriberDto>> {
    // find langids
    const langIds = currentLang ? [currentLang.id] : userPrincipal.langIds;
    return this.subscriberService.findPaginated(dto, langIds);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'User')
  @UseGuards(UserHasLanguages)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Subscriber successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscriber not found',
    type: NotFoundResponseDto,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() userPrincipal: AuthUser,
  ): Promise<void> {
    return this.subscriberService.remove(id, userPrincipal);
  }
}
