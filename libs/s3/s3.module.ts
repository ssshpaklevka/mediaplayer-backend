import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageService } from './storage.service';
import { UploadPhotoService } from './upload-photo';

@Module({
  imports: [ConfigModule],
  providers: [S3StorageService, UploadPhotoService],
  exports: [S3StorageService, UploadPhotoService],
})
export class S3Module {}
