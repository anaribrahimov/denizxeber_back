import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BannerName } from "./banner-name.entity.js";
import { BannerNameDto } from "./dto/banner-name.dto.js";
import { BannerNameMapper } from "./banner-name.mapper.js";
import { Injectable } from "@nestjs/common";

@Injectable()
export class BannerNameService {

  constructor(
    @InjectRepository(BannerName)
    private readonly bannerNameRepository: Repository<BannerName>,
  ) {}

  async get(): Promise<BannerNameDto[]> {
    return this.bannerNameRepository
      .find({
        order: {
          id: 'ASC'
        }
      })
      .then((data) => data.map(BannerNameMapper.toDto))
  }
}
