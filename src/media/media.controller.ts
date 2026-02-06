import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiExtraModels,
  ApiConsumes,
  ApiBody as ApiBodyMultipart,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { MediaRo } from './dto/media.ro';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

function toMediaRo(entity: {
  id: string;
  groups?: { id: string; name: string; enabled: boolean }[];
  url: string | null;
  name: string | null;
  status: string;
  processingError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MediaRo {
  return {
    id: entity.id,
    groupIds: (entity.groups ?? []).map((g) => g.id),
    url: entity.url,
    name: entity.name,
    status: entity.status,
    processingError: entity.processingError,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

@ApiTags('media')
@ApiExtraModels(MediaRo)
@Controller('media')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth('admin-jwt')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10 GB
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Можно загружать только видео'), false);
        }
      },
    }),
  )
  @ApiOperation({
    summary: 'Залить видео на CDN',
    description:
      'Группа + файл. Файл отправляется на конвертацию (h264, 1280x720), затем заливка на Selectel S3. Ответ сразу — «файл отправлен на конвертацию».',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBodyMultipart({
    schema: {
      type: 'object',
      required: ['groupIds', 'file'],
      properties: {
        groupIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Массив UUID групп',
        },
        name: { type: 'string', description: 'Название медиа', nullable: true },
        file: { type: 'string', format: 'binary', description: 'Видеофайл' },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Файл отправлен на конвертацию',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        mediaId: { type: 'string', format: 'uuid' },
        media: { $ref: '#/components/schemas/MediaRo' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Только видео или нет файла' })
  @ApiResponse({
    status: 503,
    description:
      'Превышен лимит одновременной обработки. Подождите, пока текущие файлы обработаются.',
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async upload(
    @Body('groupIds') groupIds: string | string[] | undefined,
    @Body('name') name: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Файл не загружен');
    }
    // Обработка массива из multipart/form-data (может прийти как строка или массив)
    let groupIdsArray: string[] = [];
    if (Array.isArray(groupIds)) {
      groupIdsArray = groupIds;
    } else if (typeof groupIds === 'string') {
      // Если пришла строка, пытаемся распарсить как JSON или использовать как один элемент
      try {
        const parsed = JSON.parse(groupIds);
        groupIdsArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        groupIdsArray = [groupIds];
      }
    }
    if (groupIdsArray.length === 0) {
      throw new BadRequestException(
        'groupIds обязателен (массив UUID групп). Отправьте как groupIds[]=uuid1&groupIds[]=uuid2',
      );
    }
    const { media, message } = await this.mediaService.createFromUpload(
      groupIdsArray,
      name ?? null,
      file.buffer,
    );
    return {
      message,
      mediaId: media.id,
      media: toMediaRo(media),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Создать медиа по ссылке (только админ)' })
  @ApiBody({ type: CreateMediaDto })
  @ApiResponse({ status: 201, description: 'Медиа создано', type: MediaRo })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async create(@Body() dto: CreateMediaDto) {
    const entity = await this.mediaService.create(dto);
    return toMediaRo(entity);
  }

  @Get()
  @ApiOperation({ summary: 'Список медиа (только админ)' })
  @ApiResponse({ status: 200, description: 'Список медиа', type: [MediaRo] })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async findAll() {
    const list = await this.mediaService.findAll();
    return list.map(toMediaRo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Медиа по id (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID медиа' })
  @ApiResponse({ status: 200, description: 'Медиа', type: MediaRo })
  @ApiResponse({ status: 404, description: 'Медиа не найдено' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const entity = await this.mediaService.findOne(id);
    return toMediaRo(entity);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить медиа (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID медиа' })
  @ApiBody({ type: UpdateMediaDto })
  @ApiResponse({ status: 200, description: 'Медиа обновлено', type: MediaRo })
  @ApiResponse({ status: 404, description: 'Медиа не найдено' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMediaDto,
  ) {
    const entity = await this.mediaService.update(id, dto);
    return toMediaRo(entity);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить медиа (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID медиа' })
  @ApiResponse({ status: 204, description: 'Медиа удалено' })
  @ApiResponse({ status: 404, description: 'Медиа не найдено' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mediaService.remove(id);
  }
}
