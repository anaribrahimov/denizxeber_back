import {
  Injectable,
} from '@nestjs/common';
import { rename, stat } from 'fs/promises';
import path from 'path';
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
  fileName: string;
  filePath: string;
  mimeType: string;
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

  needsVersion(
    imageWidth: number | null,
    imageHeight: number | null,
    versionWidth: number,
    versionHeight: number,
  ): boolean {
    return (
      (imageWidth ?? 0) > versionWidth ||
      (imageHeight ?? 0) > versionHeight
    );
  }

  async resize(
    sourcePath: string,
    destinationDir: string,
    expectedWidth: number,
    expectedHeight: number,
    quality: number | null,
  ): Promise<ThumbnailResult> {

    const ext = path.extname(sourcePath);
    const basename = path.basename(sourcePath, ext);

    // First generate the image to a temporary file.
    const tempPath = path.join(destinationDir, `${basename}-${expectedWidth}x${expectedHeight}-temp.webp`);

    const metadata = await sharp(sourcePath)
      .resize({
        width: expectedWidth,
        height: expectedHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: quality ?? 100,
      })
      .toFile(tempPath);

    const { width, height, size, format } = metadata;

    const fileName = `${basename}-${width}x${height}.webp`;
    const filePath = path.join(destinationDir, fileName);

    await rename(tempPath, filePath);

    const stats = await stat(filePath);

    return {
      width,
      height,
      size: stats.size,
      format,
      fileName,
      filePath,
      mimeType: 'image/webp',
    };
  }
}
