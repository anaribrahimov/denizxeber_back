
import { BannerNameDto } from '../banner-name/dto/banner-name.dto.js';
import { createPreviewUrl } from '../common/utils/media.util.js';
import { LanguageDto } from '../language/dto/language.dto.js';
import { Banner } from './banner.entity.js';
import { BannerCoverImageDto } from './dto/banner-cover-image.dto.js';
import { BannerDto } from './dto/banner.dto.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';

export class BannerMapper {

  static toDto(banner: Banner, publicUrl: string): BannerDto {
    const dto = new BannerDto();
    dto.id = banner.id;
    dto.language = {
      id: banner.language.id,
      name: banner.language.name,
    } as LanguageDto;
    dto.bannerName = banner.bannerName as BannerNameDto;

    const coverImageDto = new BannerCoverImageDto();
    coverImageDto.originalUrl = createPreviewUrl(publicUrl, banner.coverImage.fileKey);
    coverImageDto.thumbnailUrl =
      Array.isArray(banner.coverImage.versions) && banner.coverImage.versions.length
        ? createPreviewUrl(publicUrl, banner.coverImage.versions[0].fileKey)
        : null;
    dto.coverImage = coverImageDto;

    dto.link = banner.link ?? null;
    
    return dto;
  }

  static toEntity(dto: CreateBannerDto): Banner {
    const banner = new Banner();
    banner.bannerNameId = dto.bannerNameId;
    banner.langId = dto.langId;
    banner.coverImageId = dto.coverImageId.toString();
    banner.link = dto.link ?? null;
    return banner;
  }
}
