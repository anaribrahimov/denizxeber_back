import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { languages } from "../../language/language.cache.js";

export class CreateBannerDto {

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  bannerNameId: number;

  @IsNotEmpty()
  @IsInt()
  @IsIn(languages.map((item) => item.id))
  langId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  coverImageId: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  link?: string | null;
}
