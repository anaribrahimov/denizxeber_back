import { BannerPublicCoverImageDto } from "./banner-public-cover-image.dto.js";

export class BannerResponsePublicDto {
  link: string | null;
  bannerName: string;
  coverImage: BannerPublicCoverImageDto;
}
