import { Category } from "./category.entity.js";
import { CategoryResponseDto } from "./dto/category-response.dto.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import slug from "slug";
import { PublicCategoryResponseDto } from "./public/dto/public-category-response.dto.js";

export class CategoryMapper {

  public static toEntity(
    dto: CreateCategoryDto, 
    userId: number, 
    langId: number,
    rowNumber: number | null,
  ) {
    const category = new Category();
    category.langId = langId;
    category.name = dto.name;
    category.slug = slug(dto.name) + `-${Date.now()}`;
    category.userId = userId;
    category.rowNumber = rowNumber;
    // category.isActive = typeof dto.isActive === 'boolean' ? dto.isActive : true;
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
    dto.postsCount = category.postsCount;
    // dto.isActive = category.isActive;
    dto.rowNumber = category.rowNumber;
    return dto;
  }

  public static toReponsePublic(category: Category) {
    const dto = new PublicCategoryResponseDto();
    dto.name = category.name;
    dto.slug = category.slug;
    dto.rowNumber = category.rowNumber;
    return dto;
  }
}
