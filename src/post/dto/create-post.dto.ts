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
import { prioritiesCached } from "../../priority/priority.cache.js";

export class CreatePostDto {

  @IsNotEmpty()
  @IsInt()
  categoryId: number;

  // @IsOptional()
  // @IsBoolean({ message: 'isUpdating should be boolean' })
  // @Transform(({ value }) => {
  //   if (value == undefined) return undefined;

  //   // 2. Handle actual booleans or string variants
  //   if (
  //     value === true 
  //     || value === 'true' 
  //     || value === '1' || value === 1) return true;
    
  //   if (
  //     value === false 
  //     || value === 'false' 
  //     || value === '0' 
  //     || value === 0) return false;

  //   // 3. Return the original invalid value so @IsBoolean catches it and throws an error
  //   return value;
  // })
  // isUpdating?: boolean;

  @IsOptional()
  @IsInt()
  @IsIn([prioritiesCached.updating.id])
  priorityId?: number | null;

  @IsNotEmpty()
  @IsInt()
  @IsIn([StatusEnum.Draft, StatusEnum.Published])
  statusId: number;

  @IsNotEmpty()
  @IsInt()
  coverImageId: number;

  @Transform(({ value }) => typeof value === 'string' ? value?.trim() : value)
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
