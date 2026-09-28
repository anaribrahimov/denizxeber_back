import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_IMAGE_SIZE, multerStorageConfig, profileImageFileFilter } from "../common/multer/multer.config.js";
import { UsersService } from "./users.service.js";
import { ControllerUserResponseDto, ControllerUsersResponseDto, UserResponseDTO } from "./dto/user-response.dto.js";
import { UpdateUserDTO } from "./dto/update-user.dto.js";
import { FileCleanupInterceptor } from "../common/interceptors/file-cleanup.interceptor.js";
import { PaginateUserDto } from "./dto/paginate-user.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/interfaces/auth-user.interface.js";
import { ValidationErrorResponseDto } from "../common/dto/validation-error-response.dto.js";
import { CommonErrorDto } from "../common/dto/common-error.dto.js";

@Controller('/:lang/admin/users')
@UseGuards(RolesGuard)
@Roles('Admin')
@ApiTags('Users')
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
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: ControllerUserResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable entity',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: 413,
    description: 'Payload too large',
    type: CommonErrorDto,
  })
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: multerStorageConfig('profile-images'),
      fileFilter: profileImageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
    FileCleanupInterceptor,
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ 
          fileType: /(jpg|jpeg|png|webp)$/,
          skipMagicNumbersValidation: true,
          errorMessage: 'Only JPEG, PNG or WEBP images are allowed'
        })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    profileImage: Express.Multer.File,
  ): Promise<ControllerUserResponseDto> {
    const user: UserResponseDTO = await this.usersService.create(createUserDto, profileImage);
    return {
      data: user,
    };
  }

  @Patch('/:id')
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    type: ControllerUserResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable entity',
    type: CommonErrorDto,
  })
  @ApiResponse({
    status: 413,
    description: 'Payload too large',
    type: CommonErrorDto,
  })
  @UseInterceptors(
    FileInterceptor('profileImage', {
      storage: multerStorageConfig('profile-images'),
      fileFilter: profileImageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
    FileCleanupInterceptor,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDTO,
    @CurrentUser() currentUser: AuthUser,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ 
          fileType: /(jpg|jpeg|png|webp)$/,
          skipMagicNumbersValidation: true,
          errorMessage: 'Only JPEG, PNG or WEBP images are allowed'
        })
        .addMaxSizeValidator({ maxSize: MAX_IMAGE_SIZE })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    profileImage?: Express.Multer.File,
  ): Promise<ControllerUserResponseDto> {
    const updated: UserResponseDTO = 
      await this.usersService
        .update(id, updateUserDto, currentUser, profileImage);
    return { data: updated };
  }

  @Delete('/:id')
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthUser): Promise<void> {
    await this.usersService.delete(id, currentUser);
  }

  @Get('/:id')
  @ApiResponse({ 
    status: 200, 
    description: 'User not found',
    type: ControllerUserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async find(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ControllerUserResponseDto> {
    const user: UserResponseDTO = await this.usersService.find(id);
    return { data: user };
  }

  @Get()
  @ApiResponse({ 
    status: 200, 
    description: 'Paginated users list',
    type: ControllerUsersResponseDto,
  })
  async findPaginated(
    @Query() query: PaginateUserDto
  ): Promise<PaginatedResult<UserResponseDTO>> {
    const paginated: PaginatedResult<UserResponseDTO> = await this.usersService.findPaginated(query);
    return paginated;
  }
}
