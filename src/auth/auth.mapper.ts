import { Injectable } from "@nestjs/common";
import { LoginResponseCategoryItem, LoginResponseDto } from "./dto/login-response.dto.js";
import { User } from "../users/user.entity.js";
import { ValidatedUserDto } from "./dto/validated-user.dto.js";
import { Category } from "../category/category.entity.js";
import { languages } from "../language/language.cache.js";
import { Language } from "../language/language.entity.js";

@Injectable()
export class AuthMapper {

  toLoginResponseDto(
    accessToken: string,
    user: ValidatedUserDto,
    categories: Category[],
    // statuses,
    // priorities,
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
    response.languages = Array.isArray(user.langIds)
      ? languages.filter((item: Language) => user.langIds.includes(item.id))
      : [];
    // response.statuses = statuses;
    // response.priorities = priorities;
    return response;
  }

  toValidatedUserDto(user: User): ValidatedUserDto {
    const dto = new ValidatedUserDto;
    dto.id = user.id;
    dto.email = user.email;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.role = user.role;
    dto.langIds = Array.isArray(user.langIds) ? user.langIds : [];
    dto.profileImage = null; // todo
    return dto;
  }
}
