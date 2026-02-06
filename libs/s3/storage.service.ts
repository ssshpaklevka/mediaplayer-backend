import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageService {
  private readonly s3: S3Client;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION');
    const accessKeyId =
      this.configService.get<string>('S3_KEY') ??
      this.configService.get<string>('SELECTEL_ACCESS_KEY');
    const secretAccessKey =
      this.configService.get<string>('S3_SECRET') ??
      this.configService.get<string>('SELECTEL_SECRET_KEY');
    if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Отсутствует конфигурация S3');
    }
    this.s3 = new S3Client({
      endpoint: endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ) {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });
    await upload.done();
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (error: any) {
      throw new Error(`Не удалось удалить файл из S3: ${error.message}`);
    }
  }
}
