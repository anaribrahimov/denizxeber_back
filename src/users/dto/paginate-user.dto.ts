import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginateUserDto {

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
  search?: string;

  // @IsOptional()
  // @IsString()
  // sortBy?: string = 'createdAt';

  // @IsOptional()
  // @IsString()
  // order?: 'ASC' | 'DESC' = 'DESC';
}
