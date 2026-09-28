import { Expose, Transform } from "class-transformer";
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
import { languages } from "../../language/language.cache.js";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @Expose({ name: 'is_active' })
  @ApiProperty({
    name: 'is_active',
    // title: 'is_active',
    example: true
  })
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
  isActive?: boolean;
}
