import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessorService } from './image-processor.service.js';
import { StorageService } from './storage.service.js';
import { VideoProcessorService } from './video-processor.service.js';

@Injectable()
export class MediaService {
  constructor(
    private readonly storageService: StorageService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly videoProcessorService: VideoProcessorService,
  ) {}

  async processUpload(file: Express.Multer.File) {
    const isImage = file.mimetype.startsWith('image/');

    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      await this.storageService.delete(file.path);
      throw new BadRequestException('Unsupported file type');
    }

    let width: number | null = null;
    let height: number | null = null;

    let durationInSec: number | null = null;

    let thumbnailPath: string | null = null;

    let permanentPath: string | null = null;

    let thumbnailMimeType = 'image/webp';
    let thumbnailFilename: string | null = null;
    let thumbnailSizeInBytes: number|null = null;
    let thumbnailWidth: number|null = null;
    let thumbnailHeight: number|null = null;

    try {
      /*
       * 1. Extract metadata
       */

      if (isImage) {
        const metadata = await this.imageProcessorService.getMetadata(file.path);

        width = metadata.width;
        height = metadata.height;
      }

      if (isVideo) {
        const metadata = 
          await this.videoProcessorService.getMetadata(file.path);

        width = metadata.width;
        height = metadata.height;
        durationInSec = metadata.durationInSec;
      }

      /*
       * 2. Create permanent directory
       */

      const type = isImage ? 'images' : 'videos';

      const {
        directory,
        relativeDirectory,
      } = await this.storageService.createUploadDirectory(type);

      /*
       * 3. Generate application filename
       */

      // const extension = extname(file.originalname).toLowerCase();

      permanentPath = `${directory}/${file.filename}`;

      // console.log('directory', directory);
      // console.log('relative directory', relativeDirectory);
      // console.log('extension', extension);
      // console.log('filename', file.filename);
      // console.log('permanentpath', permanentPath);
      // console.log('path', path);

      /*
       * 4. Generate thumbnail
       */

      if (
        isImage
        && this.imageProcessorService.needsThumbnail(width, height)
      ) {
        const thumbnailDirectory = `${directory}/thumbs`;

        // console.log('thumbnail directory', thumbnailDirectory);

        await this.storageService.ensureDirectory(thumbnailDirectory);

        thumbnailFilename = `${uuidv4()}.webp`;

        thumbnailPath = `${thumbnailDirectory}/${thumbnailFilename}`;

        const thumbnail = await this.imageProcessorService.createThumbnail(file.path, thumbnailPath);

        thumbnailWidth = thumbnail?.width ?? null;
        thumbnailHeight = thumbnail?.height ?? null;
        thumbnailSizeInBytes = thumbnail?.size ?? null;
      }

      /*
       * 5. Move original file
       */

      await this.storageService.move(file.path, permanentPath);
      
      // throw new Error('Test error');

      /*
       * 6. Return domain data
       */

      return {
        originalName: file.originalname,

        filename: file.filename,

        mimeType: file.mimetype,
        size: file.size,

        path: permanentPath,

        fileKey:
          this.storageService
            .getRelativePath(
              permanentPath!,
            ),

        width,
        height,

        durationInSec,

        thumbnailPath,

        thumbnailFilename, 

        thumbnailMimeType,

        thumbnailKey:
          thumbnailPath
            ? this.storageService
                .getRelativePath(
                  thumbnailPath!,
                )
            : null,

        thumbnailSizeInBytes: thumbnailSizeInBytes,
        thumbnailWidth,
        thumbnailHeight,
      };
    } catch (error) {
      /*
       * Cleanup temporary/orphaned files.
       */

      await this.storageService.delete(
        file.path,
      );

      if (thumbnailPath) {
        await this.storageService.delete(
          thumbnailPath,
        );
      }

      if (permanentPath) {
        await this.storageService.delete(
          permanentPath,
        );
      }

      throw error;
    }
  }
}
