import { LoginResponseCategoryItem, LoginResponseDto } from "./dto/login-response.dto.js";
import { User } from "../users/user.entity.js";
import { ValidatedUserDto } from "./dto/validated-user.dto.js";
import { Category } from "../category/category.entity.js";
import { languages } from "../language/language.cache.js";
import { statuses } from "../status/status.cache.js";
import { createPreviewUrl } from "../common/utils/media.util.js";

export class AuthMapper {

  public static toLoginResponseDto(
    accessToken: string,
    user: ValidatedUserDto,
    categories: Category[],
  ): LoginResponseDto {
    const response: LoginResponseDto = new LoginResponseDto;
    response.accessToken = accessToken;
    response.user = user;
    response.categories = categories.length
      ? categories.reduce(
        (acc: LoginResponseCategoryItem[], category: Category) => {
          const item = acc.find((el) => el.langId === category.langId);
          const categoryItem = {
            id: category.id,
            name: category.name,
            slug: category.slug,
          } as Category;
          if (!item) {
            const langName = languages.find((lang) => lang.id === category.langId);
            const x = {
              langId: category.langId,
              name: langName!.name,
              categories: [categoryItem]
            } as LoginResponseCategoryItem;
            acc.push(x);
          } else {
            item.categories.push(categoryItem);
          }
          return acc;
        }, [])
      : [];
    response.languages = languages;
    response.statuses = statuses;
    return response;
  }

  public static toValidatedUserDto(user: User, publicUrl: string): ValidatedUserDto {
    const dto = new ValidatedUserDto;
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.langIds = Array.isArray(user.langIds) ? user.langIds : [];

    dto.profileImage =
      user.profileImage 
        ? {
            originalUrl: createPreviewUrl(publicUrl, user.profileImage.fileKey),
            thumbnailUrl: 
              Array.isArray(user.profileImage.versions) && user.profileImage.versions.length
                ? createPreviewUrl(publicUrl, user.profileImage.versions[0].fileKey)
                : null
          }
        : null

    return dto;
  }
}
