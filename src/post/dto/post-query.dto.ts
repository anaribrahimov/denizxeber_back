import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

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
}
