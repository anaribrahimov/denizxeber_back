import { BannerName } from "./banner-name.entity.js";
import { BannerNameDto } from "./dto/banner-name.dto.js";

export class BannerNameMapper {

  static toDto(bannerName: BannerName) {
    const dto = new BannerNameDto();
    dto.id = bannerName.id;
    dto.name = bannerName.name;
    return dto;
  }
}
