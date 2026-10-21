import { BannerNameDto } from "../../banner-name/dto/banner-name.dto.js";
import { LanguageDto } from "../../language/dto/language.dto.js";
import { BannerCoverImageDto } from "./banner-cover-image.dto.js";

export class BannerDto {

  id: number;

  bannerName: BannerNameDto;

  language: LanguageDto;

  coverImage: BannerCoverImageDto;

  link: string | null;
}
