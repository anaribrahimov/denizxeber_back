import { Transform } from "class-transformer";
import { 
  IsBoolean, 
  IsIn, 
  IsInt, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MaxLength 
} from "class-validator";
import { StatusEnum } from "../../status/status.cache.js";

export class UpdatePostDto {

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsBoolean({ message: 'isUpdating should be boolean' })
  @Transform(({ value }) => {
    if (value == undefined) return undefined;

    // 2. Handle actual booleans or string variants
    if (
      value === true
      || value === 'true'
      || value === '1' 
      || value === 1) return true;

    if (
      value === false
      || value === 'false'
      || value === '0'
      || value === 0) return false;

    // 3. Return the original invalid value so @IsBoolean catches it and throws an error
    return value;
  })
  isUpdating?: boolean;

  @IsOptional()
  @IsInt()
  @IsIn([StatusEnum.Draft, StatusEnum.Published])
  statusId: number;

  @IsOptional()
  @IsInt()
  coverImageId?: number | null;

  @Transform(({ value }) => typeof value === 'string' ? value?.trim() : value)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
