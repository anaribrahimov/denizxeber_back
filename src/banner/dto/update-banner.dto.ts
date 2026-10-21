import { IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateBannerDto {

  @IsOptional()
  @IsInt()
  @Min(1)
  bannerNameId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  coverImageId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  link?: string | null;
}

