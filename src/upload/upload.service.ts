import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { moveFile } from "../common/utils/storage.util.js";
import { Upload, UploadType } from "./upload.entity.js";
import { MediaService } from "../common/services/media.service.js";
import { StorageService } from "../common/services/storage.service.js";
import { UploadMapper } from "./upload.mapper.js";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class UploadService {

  constructor(
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
    private readonly uploadMapper: UploadMapper,
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>
  ){}
  
  public async create(file: Express.Multer.File): Promise<any> {
    const processedFile = await this.mediaService.processUpload(file);
    console.log(processedFile);

    try {
      let upload: Upload = this.uploadMapper.toEntity(
        UploadType.PUBLIC,
        processedFile.filename,
        processedFile.originalName,
        processedFile.relativePath,
        processedFile.mimeType,
        processedFile.size,
        processedFile.width,
        processedFile.height,
        processedFile.thumbnailRelativePath,
        processedFile.thumbnailWidth,
        processedFile.thumbnailHeight,
        processedFile.thumbnailSizeInBytes,
        processedFile.durationInSec,
      );

      upload = await this.uploadRepository.save(upload);

      return this.uploadMapper.toUploadResponseDto(upload);

    } catch (err) {

      if (processedFile.path) {
        await this.storageService.delete(processedFile.path);
      }
      
      if (processedFile.thumbnailPath) {
        await this.storageService.delete(processedFile.thumbnailPath);
      }
      
      throw err;
    }
  }
}
