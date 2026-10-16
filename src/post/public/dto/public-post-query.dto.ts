import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { LangCodeQueryDto } from "../../../common/dto/lang-code-query.dto.js";

export class PublicPostQueryDto extends LangCodeQueryDto {

  @IsOptional()
  @IsString()
  @MaxLength(512)
  afterCursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  authorId?: number | null;

  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // isUpdating?: number | null;

  // @IsOptional()
  // @IsString()
  // title?: string | null;

  // @IsOptional()
  // @IsString()
  // sortBy?: string | null;

  // @IsOptional()
  // @IsString()
  // order?: 'ASC' | 'DESC' | null = 'DESC';
}
