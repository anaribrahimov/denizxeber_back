import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BannerMapper } from "./banner.mapper.js";
import { Injectable } from "@nestjs/common";
import { Banner } from "./banner.entity.js";
import { Upload, UploadType } from "../upload/upload.entity.js";
import { BannerName } from "../banner-name/banner-name.entity.js";
import { CreateBannerDto } from "./dto/create-banner.dto.js";
import { BannerDto } from "./dto/banner.dto.js";
import { COVER_IMAGE_MIME_TYPES } from "../post/post.service.js";
import { ValidationException } from "../common/exceptions/validation.exception.js";
import { languages } from "../language/language.cache.js";
import { LanguageDto } from "../language/dto/language.dto.js";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class BannerService {

  private readonly filesPublicUrl: string;

  constructor(
    @InjectRepository(BannerName)
    private readonly bannerNameRepository: Repository<BannerName>,
    
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,

    private readonly configService: ConfigService,
  ) {
    this.filesPublicUrl =
      this.configService.getOrThrow<string>('app.filesPublicUrl');
  }

  async create(createBannerDto: CreateBannerDto): Promise<BannerDto> {
    const errors: Record<string, string[]> = {};

    // find language
    const lang = languages.find((item) => item.id === createBannerDto.langId);

    // check banner name exist
    const bannerName = await this.bannerNameRepository
      .findOneBy({ id: createBannerDto.bannerNameId });

    if (!bannerName) {
      errors.bannerNameId = ['Banner name not found'];
    }

    // check upload exists
    const coverImage =
      await this.uploadRepository.findOne({
        where: {
          id: createBannerDto.coverImageId,
          type: UploadType.PUBLIC,
        },
        relations: {
          versions: true,
        }
      });

    if (!coverImage) {
      errors.coverImageId = ['Cover image not found'];
    } else {
      if (!COVER_IMAGE_MIME_TYPES.includes(coverImage.fileMimeType)) {
        errors.coverImageId = [
          'invalid file type. '
          + `Allowed types: ${COVER_IMAGE_MIME_TYPES.join(', ')}`
        ];
      }
    }

    // check banner name not in use
    const exist = await this.bannerRepository
      .exists({
        where: {
          bannerNameId: createBannerDto.bannerNameId,
          langId: createBannerDto.langId,
        }
      });

    if (exist) {
      errors.bannerNameId = ['Banner name already in use'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationException(errors);
    }

    // save entity
    const banner = await this.bannerRepository
      .save(BannerMapper.toEntity(createBannerDto));
    banner.bannerName = bannerName!;
    banner.coverImage = coverImage!;
    banner.language = lang as LanguageDto;

    return BannerMapper.toDto(banner, this.filesPublicUrl);
  }
}
