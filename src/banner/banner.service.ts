import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { BannerMapper } from "./banner.mapper.js";
import { Injectable, NotFoundException } from "@nestjs/common";
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
import { UpdateBannerDto } from "./dto/update-banner.dto.js";

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

  async update(id: number, dto: UpdateBannerDto): Promise<BannerDto> {
    // find banner
    const banner = await this.bannerRepository
      .findOne({
        where: {
          id
        },
        relations: {
          coverImage: {
            versions: true
          },
          bannerName: true,
          language: true
        }
      });

    if (!banner) {
      throw new NotFoundException(`Banner not found: ${id}`);
    }

    const errors: Record<string, string[]> = {};

    if (dto.bannerNameId && dto.bannerNameId !== banner.bannerNameId) {
      const bannerName = await this.bannerNameRepository
        .findOneBy({ id: dto.bannerNameId });

      if (!bannerName) {
        errors.bannerNameId = ['Banner name not found'];
      } else {
        const exist = await this.bannerRepository
          .exists({
            where: {
              bannerNameId: dto.bannerNameId,
              langId: banner.langId,
            }
          });

        if (exist) {
          errors.bannerNameId = ['Banner name already in use'];
        } else {
          banner.bannerNameId = dto.bannerNameId;
          banner.bannerName = bannerName;
        }
      }
    }

    // check cover image exists
    if (dto.coverImageId && dto.coverImageId.toString() !== banner.coverImageId) {
      // find cover image
      const coverImage = await this.uploadRepository
        .findOne({
          where: {
            id: dto.coverImageId,
            type: UploadType.PUBLIC,
          },
          relations: {
            versions: true
          }
        });

      if (!coverImage) {
        errors['coverImageId'] = ['Cover image not found'];
      } else {
        if (!COVER_IMAGE_MIME_TYPES.includes(coverImage.fileMimeType)) {
          errors.coverImageId = [
            'invalid file type. '
            + `Allowed types: ${COVER_IMAGE_MIME_TYPES.join(', ')}`
          ];
        } else {
          banner.coverImageId = dto.coverImageId.toString();
          banner.coverImage = coverImage;
        }
      }
    }

    if (Object.keys(errors).length) {
      throw new ValidationException(errors);
    }

    if (dto.link !== undefined) {
      banner.link = dto.link;
    }

    // update banner
    await this.bannerRepository.save(banner);

    return BannerMapper.toDto(banner, this.filesPublicUrl);
  }

  async remove(id: number): Promise<void> {
    // find banner
    const banner = await this.bannerRepository
      .findOne({
        where: {
          id
        }
      });

    if (!banner) {
      throw new NotFoundException(`Banner not found: ${id}`);
    }

    await this.bannerRepository.delete(id);
  }
}
