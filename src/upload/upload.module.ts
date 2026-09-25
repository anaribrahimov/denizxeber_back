import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Upload } from "./upload.entity.js";
import { UploadController } from "./upload.controller.js";
import { UploadService } from "./upload.service.js";
import { StorageService } from "../common/services/storage.service.js";
import { MediaService } from "../common/services/media.service.js";
import { ImageProcessorService } from "../common/services/image-processor.service.js";
import { UploadMapper } from "./upload.mapper.js";
import { VideoProcessorService } from "../common/services/video-processor.service.js";
import { UploadVersion } from "./upload-version.entity.js";
import { PublicUploadController } from "./public/upload.controller.js";

@Module({
  imports: [TypeOrmModule.forFeature([Upload, UploadVersion])],
  controllers: [UploadController, PublicUploadController],
  providers: [
    UploadService, 
    StorageService, 
    MediaService, 
    ImageProcessorService, 
    UploadMapper,
    VideoProcessorService,
  ],
  exports: [UploadService],
})
export class UploadModule {}
