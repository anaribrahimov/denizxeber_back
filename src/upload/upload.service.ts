import { Injectable, NotFoundException } from "@nestjs/common";
import { Upload, UploadType } from "./upload.entity.js";
import { MediaService } from "../common/services/media.service.js";
import { StorageService } from "../common/services/storage.service.js";
import { UploadMapper } from "./upload.mapper.js";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { UploadVersion, UploadVersionType } from "./upload-version.entity.js";

@Injectable()
export class UploadService {

  constructor(
    private readonly storageService: StorageService,
    private readonly mediaService: MediaService,
    private readonly uploadMapper: UploadMapper,
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    private readonly dataSource: DataSource,
  ){}
  
  public async create(file: Express.Multer.File): Promise<any> {
    const processedFile = await this.mediaService.processUpload(file);
    // console.log(processedFile);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // create upload entity
      let upload: Upload = this.uploadMapper.toEntity(
        UploadType.PUBLIC,
        processedFile.filename,
        processedFile.originalName,
        processedFile.fileKey,
        processedFile.mimeType,
        processedFile.size,
        processedFile.width,
        processedFile.height,
        processedFile.durationInSec,
        null
      );

      // save upload
      await queryRunner.manager.save(upload);

      if (processedFile.thumbnailKey) {
        const version: UploadVersion = this.uploadMapper.toUploadVersionEntity(
          upload,
          UploadVersionType.SMALL,
          processedFile.thumbnailFilename!,
          processedFile.thumbnailMimeType,
          processedFile.thumbnailKey,
          processedFile.thumbnailWidth,
          processedFile.thumbnailHeight,
          processedFile.thumbnailSizeInBytes
        )

        // save upload versions
        await queryRunner.manager.save(version);

        // set upload entity versions
        upload.versions = [version];
      }

      await queryRunner.commitTransaction(); // commit transaction

      return this.uploadMapper.toUploadResponseDto(upload);

    } catch (err) {

      if (processedFile.path) {
        await this.storageService.delete(processedFile.path);
      }
      
      if (processedFile.thumbnailPath) {
        await this.storageService.delete(processedFile.thumbnailPath);
      }
      
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // public async readFile(filePath: string) {
  //   // find upload
  //   const upload = await this.uploadRepository
  //     .findOne({
  //       where: [
  //         { filePath: filePath },
  //         { thumbPath: filePath }
  //       ]
  //     });

  //   if (!upload) {
  //     throw new NotFoundException("File not found");
  //   }

  //   const stream = await this.storageService.readFileStream(filePath);

  //   const isThumb = filePath === upload.thumbPath;

  //   return {
  //     stream,
  //     mimeType: isThumb ? upload.thumb upload.mimeType,
  //     size: upload.s
  //   }
  // }
}
