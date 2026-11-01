import { hashPassword } from "../common/utils/auth.util.js";
import { Role } from "../roles/role.entity.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { User } from "./user.entity.js";
import { UserResponseDTO } from "./dto/user-response.dto.js";
import { Language } from "../language/language.entity.js";
import { Upload } from "../upload/upload.entity.js";
import { createPreviewUrl } from "../common/utils/media.util.js";
import { ProfileImageResponseDto, ProfileImageResponseVersionItemDto } from "./dto/profile-image-response.dto.js";
import { UploadVersion } from "../upload/upload-version.entity.js";

export class UserMapper {

  static async toEntity(dto: CreateUserDto, role: Role, upload: Upload | null): Promise<User> {
    const user = new User();
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.email = dto.email;
    user.role = role;
    user.langIds = dto.langIds;
    user.password = await hashPassword(dto.password);
    if (upload) {
      user.profileImage = upload;
    }
    user.isActive = typeof dto.isActive === 'boolean' ? dto.isActive : true;
    return user;
  }

  static toResponseDTO(
    user: User, 
    languages: Language[], 
    publicUrl: string,
    publishedPostCount: number | null,
    draftPostCount: number | null
  ): UserResponseDTO {
    const userLanguages = user.langIds
      .reduce((acc: Language[], langId: number) => {
        const lang: Language | null | undefined = languages.find((item) => item.id === langId);
        if (lang) acc.push(lang);
        return acc;
      }, []);

    const response = new UserResponseDTO();
    response.id = user.id;
    response.firstName = user.firstName;
    response.lastName = user.lastName;
    response.email = user.email;
    response.isActive = user.isActive ? true : false;
    response.role = user.role;
    response.languages = userLanguages;
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt ?? null;

    if (publishedPostCount !== null) {
      response.publishedPostCount = publishedPostCount;
    }

    if (draftPostCount !== null) {
      response.draftPostCount = draftPostCount;
    }

    let profileImageDto: ProfileImageResponseDto | null = null;
    if (user.profileImage) {
      profileImageDto = new ProfileImageResponseDto();
      profileImageDto.id = user.profileImage.id.toString();
      profileImageDto.previewUrl = 
        createPreviewUrl(publicUrl, user.profileImage.fileKey);
      profileImageDto.width = user.profileImage.fileWidth;
      profileImageDto.height = user.profileImage.fileHeight;
      profileImageDto.size = user.profileImage.fileSizeByte;
      profileImageDto.versions = [];
      if (user.profileImage.versions?.length) {
        user.profileImage.versions.forEach((item: UploadVersion) => {
          profileImageDto?.versions.push({
            version: item.version,
            previewUrl: createPreviewUrl(publicUrl, item.fileKey),
            width: item.fileWidth,
            height: item.fileHeight,
            size: item.fileSizeByte,
          } as ProfileImageResponseVersionItemDto);
        })
      }
    }

    response.profileImage = profileImageDto;
    
    return response;
  }
}
