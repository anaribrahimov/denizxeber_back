import {
  Injectable,
  Logger,
} from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { stat } from 'node:fs/promises';

export interface VideoMetadata {
  width: number | null;
  height: number | null;
  durationInSec: number | null;
  codec: string | null;
  format: string | null;
  bitrate: number | null;
  fps: number | null;
}

export interface VideoThumbnailResult {
  path: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);

  async getMetadata(filePath: string): Promise<VideoMetadata> {
    const metadata = await this.probe(filePath);

    const videoStream =
      metadata.streams.find(
        (stream) => stream.codec_type === 'video',
      );

    if (!videoStream) {
      throw new Error(
        'Video stream not found',
      );
    }

    return {
      width:
        videoStream.width ?? null,

      height:
        videoStream.height ?? null,

      durationInSec:
        this.parseNumber(
          videoStream.duration ??
            metadata.format?.duration,
        ),

      codec:
        videoStream.codec_name ?? null,

      format:
        metadata.format?.format_name ?? null,

      bitrate:
        this.parseNumber(
          metadata.format?.bit_rate,
        ),

      fps:
        this.parseFps(
          videoStream.r_frame_rate,
        ),
    };
  }

  async createThumbnail(
    sourcePath: string,
    destinationPath: string,
  ): Promise<VideoThumbnailResult> {
    /*
     * First get metadata so we can select a sensible
     * thumbnail timestamp.
     */
    const metadata =
      await this.probe(sourcePath);

    const videoStream =
      metadata.streams.find(
        (stream) => stream.codec_type === 'video',
      );

    if (!videoStream) {
      throw new Error(
        'Video stream not found',
      );
    }

    const duration =
      this.parseNumber(
        videoStream.duration ??
          metadata.format?.duration,
      );

    /*
     * Avoid taking the very first frame.
     *
     * For example:
     *
     * 10 second video -> 2 seconds
     * 60 second video -> 6 seconds
     * 300 second video -> 30 seconds
     *
     * But never later than 10 seconds.
     */
    const timestamp =
      this.getThumbnailTimestamp(
        duration,
      );

    await this.generateThumbnail(
      sourcePath,
      destinationPath,
      timestamp,
    );

    const fileStats =
      await stat(destinationPath);

    const thumbnailMetadata =
      await this.probe(destinationPath);

    const thumbnailStream =
      thumbnailMetadata.streams.find(
        (stream) =>
          stream.codec_type === 'video',
      );

    return {
      path: destinationPath,

      width:
        thumbnailStream?.width ?? 0,

      height:
        thumbnailStream?.height ?? 0,

      size: fileStats.size,

      format:
        thumbnailMetadata.format
          ?.format_name ?? 'webp',
    };
  }

  private probe(
    filePath: string,
  ): Promise<ffmpeg.FfprobeData> {
    return new Promise(
      (resolve, reject) => {
        ffmpeg.ffprobe(
          filePath,
          (error, data) => {
            if (error) {
              this.logger.error(
                `Failed to probe video: ${filePath}`,
                error.message,
              );

              reject(error);
              return;
            }

            resolve(data);
          },
        );
      },
    );
  }

  private generateThumbnail(
    sourcePath: string,
    destinationPath: string,
    timestamp: number,
  ): Promise<void> {
    return new Promise(
      (resolve, reject) => {
        ffmpeg(sourcePath)
          .seekInput(timestamp)
          .frames(1)
          .outputOptions([
            '-vf',
            'scale=300:300:force_original_aspect_ratio=decrease',
          ])
          .outputOptions([
            '-c:v',
            'libwebp',
          ])
          .outputOptions([
            '-quality',
            '80',
          ])
          .outputOptions([
            '-an',
          ])
          .output(destinationPath)
          .on('end', () => {
            resolve();
          })
          .on('error', (error) => {
            this.logger.error(
              `Failed to create video thumbnail: ${sourcePath}`,
              error.message,
            );

            reject(error);
          })
          .run();
      },
    );
  }

  private getThumbnailTimestamp(
    duration: number | null,
  ): number {
    if (!duration || duration <= 0) {
      return 0;
    }

    /*
     * Take approximately 10% into the video,
     * but never later than 10 seconds.
     *
     * This avoids black/intro frames in many videos.
     */
    return Math.min(
      duration * 0.1,
      10,
    );
  }

  private parseNumber(
    value: string | number | undefined,
  ): number | null {
    if (
      value === undefined ||
      value === null
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  private parseFps(
    value: string | undefined,
  ): number | null {
    if (!value) {
      return null;
    }

    const [numerator, denominator] =
      value.split('/').map(Number);

    if (
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator) ||
      denominator === 0
    ) {
      return null;
    }

    return numerator / denominator;
  }
}
