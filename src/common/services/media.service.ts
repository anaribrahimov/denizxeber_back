import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ImageProcessorService } from './image-processor.service.js';
import { StorageService } from './storage.service.js';
import { VideoProcessorService } from './video-processor.service.js';
import { ConfigService } from '@nestjs/config';

export interface ProcessedFileResult {
  originalName: string,

  filename: string,

  mimeType: string,
  size: number,

  path: string,

  fileKey: string,

  width: number | null,
  height: number | null,

  durationInSec?: number | null,

  versions: UploadVersionItem[];
}

export interface UploadVersionItem {
  path: string;
  fileName: string;
  mimeType: string;
  fileKey: string;
  width: number;
  height: number;
  size: number; 
  versionName: string,
}

interface UploadVersionSettingValue {
  width: number;
  height: number;
  quality?: number | null;
}

export const UploadVersionSettings: Record<string, UploadVersionSettingValue> = Object.freeze({
  thumbnail: {
    width: 150,
    height: 150,
    quality: 75
  },
  small: {
    width: 300,
    height: 300,
    quality: 80,
  },
  medium: {
    width: 640,
    height: 640,
    quality: 82
  },
  large: {
    width: 1280,
    height: 1280,
    quality: 85,
  },
});

@Injectable()
export class MediaService {

  private readonly appUrl: string;
  private readonly filesPublicUrl: string;
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly storageService: StorageService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.getOrThrow<string>('app.url');
    this.filesPublicUrl =
      this.configService.getOrThrow<string>('app.filesPublicUrl');
  }

  private async processUploadVersions(
    filePath: string,
    fileWidth: number | null,
    fileHeight: number | null,
    destinationDir: string,
  ): Promise<UploadVersionItem[]> {
    const versions: UploadVersionItem[] = [];
    
    for (const versionName of Object.keys(UploadVersionSettings)) {
      
      const versionSetting: UploadVersionSettingValue = 
        UploadVersionSettings[versionName];
      
      if (!this.imageProcessorService
        .needsVersion(fileWidth, fileHeight, versionSetting.width, versionSetting.height)) {
        continue;
      }

      const version = await this.imageProcessorService
        .resize(
          filePath,
          destinationDir,
          versionSetting.width,
          versionSetting.height,
          versionSetting.quality ?? null
        );

      versions.push({
        path: version.filePath,
        fileName: version.fileName,
        fileKey: this.storageService.getRelativePath(version.filePath),
        width: version.width,
        height: version.height,
        size: version.size,
        mimeType: version.mimeType,
        versionName,
      })
    }

    return versions;
  }

  async processUpload(file: Express.Multer.File): Promise<ProcessedFileResult> {
    const isImage = file.mimetype.startsWith('image/');

    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo) {
      // await this.storageService.delete(file.path);
      throw new BadRequestException('Unsupported file type');
    }

    let width: number | null = null;
    let height: number | null = null;

    let durationInSec: number | null = null;

    let permanentPath: string | null = null;

    const versions: UploadVersionItem[] = [];

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
      // console.log('mimetype', file.mimetype);

      /*
       * 4. Generate versions
       */

      if (
        isImage
        && file.mimetype !== 'image/gif'
      ) {
        versions.push(...await this.processUploadVersions(
          file.path,
          width,
          height,
          directory
        ))
      }

      /*
       * 5. Move original file
       */

      await this.storageService.move(file.path, permanentPath);

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

        versions,
      };
    } catch (error) {
      /*
       * Cleanup temporary/orphaned files.
       */

      await this.storageService.delete(
        file.path,
      );

      if (permanentPath) {
        await this.storageService.delete(
          permanentPath,
        );
      }

      for (const version of versions) {
        if (!version.path) {
          continue;
        }
        this.logger.debug(`Deleting version file: ${version.path}`);
        await this.storageService.delete(version.path);
      }

      throw error;
    }
  }

  createPreviewUrl(fileKey: string) {
    const endpoint = `content/uploads/${fileKey}`;
    return this.appUrl + '/' + endpoint;
  }

  getFilePublicUrl() {
    return this.filesPublicUrl;
  }
}
