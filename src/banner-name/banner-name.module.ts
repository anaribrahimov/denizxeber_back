
import { Module } from '@nestjs/common';
import { BannerName } from './banner-name.entity.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerNameController } from './banner-name.controller.js';
import { BannerNameService } from './banner-name.service.js';


@Module({
  imports: [
    TypeOrmModule.forFeature([BannerName]),
  ],
  controllers: [BannerNameController],
  providers: [BannerNameService],
  exports: [BannerNameService],
})
export class BannerNameModule {}
