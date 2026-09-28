import {
  Injectable,
} from '@nestjs/common';
import sharp from 'sharp';

export const THUMBNAIL_SIZE = 300;
export const THUMBNAIL_QUALITY = 80;

export interface ImageMetadata {
  width: number | null;
  height: number | null;
  format: string | null;
}

export interface ThumbnailResult {
  width: number;
  height: number;
  size: number;
  format: string;
}

@Injectable()
export class ImageProcessorService {
  
  async getMetadata(
    filePath: string
  ): Promise<ImageMetadata> {
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      format: metadata.format ?? null,
    };
  }

  needsThumbnail(
    width: number | null,
    height: number | null,
  ): boolean {
    return (
      (width ?? 0) > THUMBNAIL_SIZE ||
      (height ?? 0) > THUMBNAIL_SIZE
    );
  }

  async createThumbnail(
    sourcePath: string,
    destinationPath: string,
  ): Promise<ThumbnailResult> {
    const metadata =
      await sharp(sourcePath)
        .resize({
          width: THUMBNAIL_SIZE,
          height: THUMBNAIL_SIZE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: THUMBNAIL_QUALITY,
        })
        .toFile(destinationPath);

    return {
      width: metadata.width,
      height: metadata.height,
      size: metadata.size,
      format: metadata.format,
    };
  }
}
