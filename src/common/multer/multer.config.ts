import 'dotenv/config';
import { BadRequestException } from '@nestjs/common';
// import { mkdir } from 'node:fs/promises';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { mkdir } from 'fs/promises';

const localStoragePath: string = process.env.LOCAL_STORAGE_PATH!;
// const MIME_TO_EXT: Record<string, string> = {
//   'image/jpeg': '.jpg',
//   'image/jpg': '.jpg',
//   'image/png': '.png',
//   'image/webp': '.webp',
//   'video/mp4': '.mp4',
//   'video/mpeg': '.mpeg',
//   'video/quicktime': '.mov',
//   'video/webm': '.webm',
// };
const PROFILE_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const PROFILE_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export const IMAGE_MIME_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg'], 
  'image/jpg': ['.jpg'], 
  'image/png': ['.png'],
  'image/gif': ['.gif'],
};

export const VIDEO_MIME_TYPES: Record<string, string[]> = {
  'video/mp4': ['.mp4'], 
  'video/mpeg': ['.mpeg'], 
  'video/quicktime': ['.mov', '.qt'],
  'video/webm': ['.webm']
};

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  ...IMAGE_MIME_TYPES, 
  ...VIDEO_MIME_TYPES
};

export const SUPPORTED_FILE_MIME_TYPES: string[] = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webm',
  'image/gif',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
];

export const SUPPORTED_FILE_EXTS: string[] = [
  '.jpg',
  '.png',
  '.webm',
  '.gif',
  '.mp4',
  '.mpeg',
  '.mov',
  '.qt',
  '.webm',
];

export const MAX_IMAGE_SIZE = 
  process.env.IMAGE_UPLOAD_LIMIT_IN_BYTES 
    ? parseInt(process.env.IMAGE_UPLOAD_LIMIT_IN_BYTES)
    : 10 * 1024 * 1024; // 10MB

export const MAX_VIDEO_SIZE =
  process.env.VIDEO_UPLOAD_LIMIT_IN_BYTES 
    ? parseInt(process.env.VIDEO_UPLOAD_LIMIT_IN_BYTES)
    : 50 * 1024 * 1024; // 50MB

// Generic storage factory - stores files in different folders per entity
export const multerStorageConfig = (directory: string) =>
  diskStorage({
    // destination: join(localStoragePath, 'uploads', directory),
    destination: async (req, file, callback) => {
      try {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        const destination = join(
          localStoragePath,
          'uploads',
          'tmp',
          String(year),
          String(month),
        );

        await mkdir(destination, { recursive: true });

        callback(null, destination);
      } catch (error) {
        callback(error as Error, '');
      }
    },
    filename: (req, file, callback) => {
      const uniqueSuffix = uuidv4();
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  });

// Filter: images only (for user profile)
export const profileImageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname);
  const allowedExtensions = [
    PROFILE_IMAGE_MIME_TO_EXT['image/jpeg'], 
    PROFILE_IMAGE_MIME_TO_EXT['image/jpg'],
    PROFILE_IMAGE_MIME_TO_EXT['image/png'],
    PROFILE_IMAGE_MIME_TO_EXT['image/webp'],
  ];
  if (
    !PROFILE_IMAGE_MIME_TYPES.includes(file.mimetype)
    || !allowedExtensions.includes(ext)
  ) {
    return callback(
      new BadRequestException('Only JPEG and PNG images are allowed'),
      false,
    );
  }
  callback(null, true);
};

// Filter: images only (for user profile)
export const commonUploadFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = extname(file.originalname);

  if (!SUPPORTED_FILE_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException(`Supported mime types are ${SUPPORTED_FILE_MIME_TYPES.join(', ')}`),
      false,
    );
  }

  if (!SUPPORTED_FILE_EXTS.includes(ext)) {
    return callback(
      new BadRequestException(`Supported file extensions are ${SUPPORTED_FILE_EXTS.join(', ')}`),
      false,
    );
  }

  callback(null, true);
};
