import { response } from "express";
import { hashPassword } from "../common/utils/auth.util.js";
import { Role } from "../roles/role.entity.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { User } from "./user.entity.js";
import { UserResponseDTO } from "./dto/user-response.dto.js";
import { Language } from "../language/language.entity.js";
import { Upload } from "../uploads/upload.entity.js";

export class UserMapper {

  static async toEntity(dto: CreateUserDto, role: Role, upload: Upload | null): Promise<User> {
    const user = new User();
    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.email = dto.email;
    user.role = role;
    user.langIds = dto.langIds;
    user.password = await hashPassword(dto.password);
    if (upload) user.profileImage = upload;
    user.isActive = typeof dto.isActive === 'boolean' ? dto.isActive : true;
    return user;
  }

  static toResponseDTO(user: User, languages: Language[]): UserResponseDTO {
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
    response.profileImageUrl = user.profileImage
      ? user.profileImage.filePath
      : null;
    return response;
  }
}