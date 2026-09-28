import { registerAs } from '@nestjs/config';
import { join } from 'path';

export const storageConfig = registerAs('storage', () => ({
  localPath: process.env.LOCAL_STORAGE_PATH,
  localUploadsPath: join(process.env.LOCAL_STORAGE_PATH!, './uploads'),
}));
