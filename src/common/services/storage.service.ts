import {
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  mkdir,
  rename,
  unlink,
  stat,
} from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
} from 'node:path';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private readonly uploadsPath: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.uploadsPath = resolve(
      this.configService.getOrThrow<string>(
        'storage.localUploadsPath',
      ),
    );
  }

  get rootPath(): string {
    return this.uploadsPath;
  }

  async ensureDirectory(
    directory: string,
  ): Promise<void> {
    await mkdir(directory, {
      recursive: true,
    });
  }

  async createUploadDirectory(
    type: 'images' | 'videos',
  ): Promise<{
    directory: string;
    relativeDirectory: string;
  }> {
    const now = new Date();

    const year = String(
      now.getFullYear(),
    );

    const month = String(
      now.getMonth() + 1,
    ).padStart(2, '0');

    const relativeDirectory = join(
      type,
      year,
      month,
    );

    const directory = join(
      this.uploadsPath,
      relativeDirectory,
    );

    await this.ensureDirectory(directory);

    return {
      directory,
      relativeDirectory,
    };
  }

  async move(
    source: string,
    destination: string,
  ): Promise<void> {
    await this.ensureDirectory(
      dirname(destination),
    );

    await rename(
      source,
      destination,
    );
  }

  async delete(
    filePath: string | null | undefined,
  ): Promise<void> {
    if (!filePath) {
      return;
    }

    try {
      if (!existsSync(filePath)) return;
      const stats = await stat(filePath);
      if (stats.isDirectory()) return;
      await unlink(filePath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        this.logger.warn(
          `Failed to delete file: ${filePath}`,
        );
      }
    }
  }

  async exists(
    filePath: string,
  ): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getRelativePath(
    absolutePath: string,
  ): string {
    return relative(
      this.uploadsPath,
      resolve(absolutePath),
    ).split('\\').join('/');
  }

  getAbsolutePath(
    relativePath: string,
  ): string {
    return resolve(
      this.uploadsPath,
      relativePath,
    );
  }
}
