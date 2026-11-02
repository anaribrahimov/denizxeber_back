
import { BannerNameDto } from '../banner-name/dto/banner-name.dto.js';
import { createPreviewUrl } from '../common/utils/media.util.js';
import { LanguageDto } from '../language/dto/language.dto.js';
import { UploadVersion } from '../upload/upload-version.entity.js';
import { Banner } from './banner.entity.js';
import { BannerCoverImageDto, BannerCoverImageVersionItemDto } from './dto/banner-cover-image.dto.js';
import { BannerDto } from './dto/banner.dto.js';
import { CreateBannerDto } from './dto/create-banner.dto.js';

export class BannerMapper {

  static toDto(banner: Banner, publicUrl: string): BannerDto {
    const coverImageDto = new BannerCoverImageDto();
    coverImageDto.id = banner.coverImage.id.toString();
    coverImageDto.previewUrl = 
      createPreviewUrl(publicUrl, banner.coverImage.fileKey);
    coverImageDto.width = banner.coverImage.fileWidth;
    coverImageDto.height = banner.coverImage.fileHeight;
    coverImageDto.size = banner.coverImage.fileSizeByte;
    coverImageDto.versions = [];
    if (banner.coverImage.versions?.length) {
      banner.coverImage.versions.forEach((item: UploadVersion) => {
        coverImageDto?.versions.push({
          version: item.version,
          previewUrl: createPreviewUrl(publicUrl, item.fileKey),
          width: item.fileWidth,
          height: item.fileHeight,
          size: item.fileSizeByte,
        } as BannerCoverImageVersionItemDto);
      })
    }

    const dto = new BannerDto();
    dto.id = banner.id;
    dto.language = {
      id: banner.language.id,
      name: banner.language.name,
    } as LanguageDto;
    dto.bannerName = banner.bannerName as BannerNameDto;
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
