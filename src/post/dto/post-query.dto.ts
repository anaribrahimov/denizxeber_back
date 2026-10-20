import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { languages } from '../../language/language.cache.js';
import { prioritiesCached } from '../../priority/priority.cache.js';

export class PostQueryDto {

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 1;

  @IsOptional()
  @IsString()
  @IsIn(languages.map((item) => item.name))
  langCode?: string;

  @IsOptional()
  @IsString()
  user?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  statusId?: number | null;

  // @IsOptional()
  // @Type(() => Number)
  // @IsInt()
  // isUpdating?: number | null;

  @IsOptional()
  @IsString()
  title?: string | null;

  // @IsOptional()
  // @IsString()
  // sortBy?: string | null;

  // @IsOptional()
  // @IsString()
  // order?: 'ASC' | 'DESC' | null = 'DESC';

  @IsOptional()
  @IsIn([prioritiesCached.updating.id.toString(), prioritiesCached.updated.id.toString()])
  priorityId?: string | null;
}
