import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Media } from './entities/media.entity';
import { Group } from '../group/entities/group.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { VideoProcessorService } from './video-processor.service';
import { S3Module } from '@libs/s3/s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Media, Group]), ConfigModule, S3Module],
  controllers: [MediaController],
  providers: [MediaService, VideoProcessorService],
  exports: [MediaService],
})
export class MediaModule {}
