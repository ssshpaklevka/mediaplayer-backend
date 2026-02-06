import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3StorageService } from '@libs/s3/storage.service';
import { S3_PATCH_ENUM } from '@libs/s3/enum/s3.pach.enum';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/** Таймаут конвертации (мс). При превышении — FAILED с "Conversion timeout". */
const CONVERSION_TIMEOUT_MS = 25 * 60 * 1000; // 25 мин

/**
 * Конвертирует видео в h264 1280x720 и заливает на Selectel S3 (CDN).
 * Профиль main, частые ключевые кадры и мало B‑кадров — для лёгкого декодирования на слабых плеерах (Orange Pi и т.п.).
 */
@Injectable()
export class VideoProcessorService {
  constructor(
    private readonly configService: ConfigService,
    private readonly s3Storage: S3StorageService,
  ) {}

  /**
   * Конвертация: h264, 1280x720, затем заливка в S3.
   * Возвращает публичную ссылку на CDN.
   */
  async convertAndUpload(
    inputBuffer: Buffer,
    outputKey: string,
  ): Promise<string> {
    const tmpDir = os.tmpdir();
    const inputPath = path.join(
      tmpDir,
      `media-in-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`,
    );
    const outputPath = path.join(
      tmpDir,
      `media-out-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`,
    );

    try {
      await fs.writeFile(inputPath, inputBuffer);

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          const stderrLines: string[] = [];
          const cmd = ffmpeg(inputPath)
            .outputOptions([
              '-c:v libx264',
              '-pix_fmt yuv420p',
              '-preset fast',
              '-crf 23',
              '-profile:v main',
              '-level 4.0',
              '-g 50',
              '-bf 2',
              '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
              '-c:a aac',
              '-b:a 128k',
              '-movflags +faststart',
            ])
            .output(outputPath)
            .on('stderr', (line: string) => {
              stderrLines.push(line);
            })
            .on('end', () => resolve())
            .on('error', (err: Error) => {
              const stderrTail = stderrLines.slice(-20).join(' ');
              const detail =
                stderrTail.length > 0
                  ? `${err.message}. ffmpeg stderr: ${stderrTail}`
                  : err.message;
              reject(new Error(detail));
            });
          cmd.run();
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Conversion timeout (25 min)')),
            CONVERSION_TIMEOUT_MS,
          ),
        ),
      ]);

      const outputBuffer = await fs.readFile(outputPath);
      const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
      if (!bucketName) {
        throw new Error('Отсутствуют настройки S3_BUCKET_NAME');
      }
      const fullPath = `television/${S3_PATCH_ENUM.MEDIA_VIDEO}/${outputKey}`;
      await this.s3Storage.uploadFile(
        bucketName,
        fullPath,
        outputBuffer,
        'video/mp4',
      );

      const bucketId = this.configService.get<string>('S3_BUCKET_ID');
      const cdnUrl = `https://${bucketId}.selstorage.ru/${fullPath}`;
      return cdnUrl;
    } finally {
      await fs.unlink(inputPath).catch(() => {});
      await fs.unlink(outputPath).catch(() => {});
    }
  }
}
