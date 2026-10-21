
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerController } from './banner.controller.js';
import { BannerService } from './banner.service.js';
import { Banner } from './banner.entity.js';
import { BannerName } from '../banner-name/banner-name.entity.js';
import { Upload } from '../upload/upload.entity.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([Banner, BannerName, Upload]),
  ],
  controllers: [BannerController],
  providers: [BannerService],
  exports: [BannerService],
})
export class BannerModule {}
