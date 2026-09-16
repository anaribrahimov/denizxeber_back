import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_IMAGE_SIZE, multerStorageConfig, profileImageFileFilter } from "../common/multer/multer.config.js";
import { UsersService } from "./users.service.js";
import { UserResponseDTO } from "./dto/user-response.dto.js";
import { UpdateUserDTO } from "./dto/update-user.dto.js";
import { FileCleanupInterceptor } from "../common/interceptors/file-cleanup.interceptor.js";
import { PaginateUserDto } from "./dto/paginate-user.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";
import { Roles } from "../auth/decorators/roles.decorator.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator.js";
import type { AuthUser } from "../auth/interfaces/auth-user.interface.js";

@Controller('/admin/users')
@UseGuards(RolesGuard)
@Roles('Admin')
@ApiTags('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(
    FileInterceptor('profile_image', {
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
  ) {
    const user: UserResponseDTO = await this.usersService.create(createUserDto, profileImage);
    return {
      data: user,
    };
  }

  @Patch('/:id')
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @UseInterceptors(
    FileInterceptor('profile_image', {
      storage: multerStorageConfig('profile-images'),
      fileFilter: profileImageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
    FileCleanupInterceptor,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDTO,
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
    @CurrentUser() currentUser: AuthUser,
  ) {
    await this.usersService.update(id, updateUserDto, currentUser, profileImage);
    return {
      message: 'User successfully updated',
    }
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
  async find(@Param('id', ParseIntPipe) id: number) {
    const user: UserResponseDTO = await this.usersService.find(id);
    return { data: user };
  }

  @Get()
  async findPaginated(@Query() query: PaginateUserDto): Promise<PaginatedResult<UserResponseDTO>> {
    const paginated: PaginatedResult<UserResponseDTO> = await this.usersService.findPaginated(query);
    return paginated;
  }
}
