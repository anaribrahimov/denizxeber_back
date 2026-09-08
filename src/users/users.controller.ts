import { Body, ClassSerializerInterceptor, Controller, HttpStatus, ParseFilePipeBuilder, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { FileInterceptor } from "@nestjs/platform-express";
import { MAX_IMAGE_SIZE, multerStorageConfig, profileImageFileFilter } from "../common/multer/multer.config.js";
import { UsersService } from "./users.service.js";
import { UserResponseDTO } from "./dto/user-response.dto.js";

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
  )
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
}
