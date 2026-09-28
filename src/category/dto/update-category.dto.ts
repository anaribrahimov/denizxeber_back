import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  // @Expose({ name: 'lang_id' })
  // @IsNumber()
  // @IsNotEmpty()
  // @IsIn(languages().map((item) => item.id))
  // langId: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @Expose({ name: 'is_active' })
  @ApiProperty({ name: 'is_active', example: true })
  @IsOptional()
  @Transform(({ value }) => {
    // 1. Pass through null/undefined so @IsOptional can handle it
    if (value === null || value === undefined || value === '') return undefined;

    // 2. Handle actual booleans or string variants
    if (value === true || value === 'true' || value === '1' || value === 1) return true;
    if (value === false || value === 'false' || value === '0' || value === 0) return false;

    // 3. Return the original invalid value so @IsBoolean catches it and throws an error
    return value;
  })
  isActive: boolean;

  @ApiProperty({ 
    name: 'change_posts_category_id', 
    example: 1,
    description: 'Category id to which this category posts will be changed',
  })
  @Expose({ name: 'change_posts_category_id' })
  @IsOptional()
  @IsNumber()
  changePostsCategoryId: number;
}
