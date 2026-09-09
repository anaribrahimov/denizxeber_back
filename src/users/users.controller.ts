import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseFilePipeBuilder, Patch, Post, Query, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_IMAGE_SIZE, multerStorageConfig, profileImageFileFilter } from "../common/multer/multer.config.js";
import { UsersService } from "./users.service.js";
import { UserResponseDTO } from "./dto/user-response.dto.js";
import { UpdateUserDTO } from "./dto/update-user.dto.js";
import { FileCleanupInterceptor } from "../common/interceptors/file-cleanup.interceptor.js";
import { PaginateUserDto } from "./dto/paginate-user.dto.js";
import { PaginatedResult } from "../common/interfaces/paginated-result.interface.js";

@Controller('/admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
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
  @UseInterceptors(
    FileInterceptor('profile_image', {
      storage: multerStorageConfig('profile-images'),
      fileFilter: profileImageFileFilter,
      limits: { fileSize: MAX_IMAGE_SIZE },
    }),
    FileCleanupInterceptor,
  )
  async update(
    @Param('id') id: number,
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
  ) {
    await this.usersService.update(id, updateUserDto, profileImage);
    return {
      message: 'User successfully updated',
    }
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: number) {
    await this.usersService.delete(id);
  }

  @Get('/:id')
  async find(@Param('id') id: number) {
    const user: UserResponseDTO = await this.usersService.find(id);
    return { data: user };
  }

  @Get()
  async findPaginated(@Query() query: PaginateUserDto): Promise<PaginatedResult<UserResponseDTO>> {
    const paginated: PaginatedResult<UserResponseDTO> = await this.usersService.findPaginated(query);
    return paginated;
  }
}
