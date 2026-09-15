import { Category } from "./category.entity.js";
import { CategoryResponseDto } from "./dto/category-response.dto.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import slug from "slug";

export class CategoryMapper {

  public static toEntity(dto: CreateCategoryDto, userId: number, langId: number) {
    const category = new Category();
    category.langId = langId;
    category.name = dto.name;
    category.slug = slug(dto.name);
    category.userId = userId;
    category.isActive = typeof dto.isActive === 'boolean' ? dto.isActive : true;
    return category;
  }

  public static toReponse(category: Category) {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.userId = +category.userId;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    dto.isActive = category.isActive;
    return dto;
  }
}
