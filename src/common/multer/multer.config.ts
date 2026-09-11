import 'dotenv/config';
import { BadRequestException } from '@nestjs/common';
// import { mkdir } from 'node:fs/promises';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

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
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const VIDEO_MIME_TYPES = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Generic storage factory - stores files in different folders per entity
export const multerStorageConfig = (directory: string) =>
  diskStorage({
    destination: join(localStoragePath, 'uploads', directory),
    // destination: async (req, file, callback) => {
    //   try {
    //     const now = new Date();

    //     const year = now.getFullYear();
    //     const month = String(now.getMonth() + 1).padStart(2, '0');

    //     let folder: 'video' | 'image' | 'unknown';

    //     if (VIDEO_MIME_TYPES.includes(file.mimetype)) folder = 'video';
    //     else if (IMAGE_MIME_TYPES.includes(file.mimetype)) folder = 'image';
    //     else folder = 'unknown';

    //     const destination = join(
    //       storagePath,
    //       'temporary-uploads',
    //       folder,
    //       String(year),
    //       month,
    //     );

    //     await mkdir(destination, { recursive: true });

    //     callback(null, destination);
    //   } catch (error) {
    //     callback(error as Error, '');
    //   }
    // },
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

// Filter: images OR videos (for post)
export const postFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowed = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES];
  if (!allowed.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        'Only JPEG, PNG images or MP4/MOV/WEBM videos are allowed',
      ),
      false,
    );
  }
  callback(null, true);
};
