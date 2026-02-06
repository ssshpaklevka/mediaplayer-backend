import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Media } from './entities/media.entity';
import { Group } from '../group/entities/group.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { VideoProcessorService } from './video-processor.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    private readonly videoProcessor: VideoProcessorService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateMediaDto): Promise<Media> {
    const url = dto.url?.trim();
    if (!url) {
      throw new BadRequestException(
        'Для создания по ссылке укажите url; для загрузки файла используйте POST /media/upload',
      );
    }
    if (!dto.groupIds || dto.groupIds.length === 0) {
      throw new BadRequestException('Необходимо указать хотя бы одну группу');
    }
    const groups = await this.groupRepository.findBy({ id: In(dto.groupIds) });
    if (groups.length !== dto.groupIds.length) {
      throw new NotFoundException('Одна или несколько групп не найдены');
    }
    const media = this.mediaRepository.create({
      url,
      name: dto.name ?? null,
      status: 'READY',
      processingError: null,
      groups,
    });
    return this.mediaRepository.save(media);
  }

  /**
   * Получить общий размер всех PENDING файлов в байтах
   */
  async getTotalPendingSize(): Promise<number> {
    const pendingMedia = await this.mediaRepository.find({
      where: { status: 'PENDING' },
      select: ['fileSize'],
    });
    return pendingMedia.reduce((sum, m) => sum + (m.fileSize ?? 0), 0);
  }

  /**
   * Проверить, можно ли загрузить файл (не превышен лимит PENDING)
   */
  async canUploadFile(
    fileSize: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const maxPendingSizeGB = this.configService.get<number>(
      'MAX_PENDING_SIZE_GB',
      5,
    );
    const maxPendingSizeBytes = maxPendingSizeGB * 1024 * 1024 * 1024;

    const currentPendingSize = await this.getTotalPendingSize();
    const newTotalSize = currentPendingSize + fileSize;

    if (newTotalSize > maxPendingSizeBytes) {
      const currentGB = (currentPendingSize / (1024 * 1024 * 1024)).toFixed(2);
      const maxGB = maxPendingSizeGB.toFixed(2);
      const fileGB = (fileSize / (1024 * 1024 * 1024)).toFixed(2);

      return {
        allowed: false,
        reason: `Превышен лимит одновременной обработки. Текущая очередь: ${currentGB} GB из ${maxGB} GB. Размер файла: ${fileGB} GB. Подождите несколько минут, пока текущие файлы обработаются.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Создать медиа из загруженного видео: запись со статусом PENDING,
   * конвертация и заливка на S3 в фоне. Ответ сразу — «файл отправлен на конвертацию».
   */
  async createFromUpload(
    groupIds: string[],
    name: string | null,
    fileBuffer: Buffer,
  ): Promise<{ media: Media; message: string }> {
    const fileSize = fileBuffer.length;

    // Проверка лимита PENDING файлов
    const check = await this.canUploadFile(fileSize);
    if (!check.allowed) {
      throw new ServiceUnavailableException(check.reason);
    }

    if (!groupIds || groupIds.length === 0) {
      throw new BadRequestException('Необходимо указать хотя бы одну группу');
    }
    const groups = await this.groupRepository.findBy({ id: In(groupIds) });
    if (groups.length !== groupIds.length) {
      throw new NotFoundException('Одна или несколько групп не найдены');
    }

    const media = this.mediaRepository.create({
      url: null,
      name: name ?? null,
      status: 'PENDING',
      processingError: null,
      fileSize, // Сохраняем размер для отслеживания
      groups,
    });
    const saved = await this.mediaRepository.save(media);
    const mediaId = saved.id;

    this.logger.log(
      `Загрузка файла: ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB. Всего PENDING: ${((await this.getTotalPendingSize()) / (1024 * 1024 * 1024)).toFixed(2)} GB`,
    );

    setImmediate(() => {
      this.processVideoInBackground(mediaId, fileBuffer).catch(() => {});
    });

    return {
      media: saved,
      message:
        'Файл отправлен на конвертацию. После обработки (h264, 1280x720) будет залит на устройство.',
    };
  }

  private async processVideoInBackground(
    mediaId: string,
    fileBuffer: Buffer,
  ): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
    });
    if (!media || media.status !== 'PENDING') {
      return;
    }

    try {
      const url = await this.videoProcessor.convertAndUpload(
        fileBuffer,
        `${mediaId}.mp4`,
      );
      media.url = url;
      media.status = 'READY';
      media.processingError = null;
      media.fileSize = null; // Очищаем размер после обработки (больше не нужен)
      await this.mediaRepository.save(media);

      this.logger.log(
        `Медиа ${mediaId} успешно обработано. Осталось PENDING: ${((await this.getTotalPendingSize()) / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      );
    } catch (err: any) {
      media.status = 'FAILED';
      const raw = err?.message ?? String(err);
      media.processingError =
        raw.length > 512 ? `${raw.slice(0, 509)}...` : raw;
      media.fileSize = null; // Очищаем размер при ошибке
      await this.mediaRepository.save(media);

      this.logger.error(
        `Ошибка обработки медиа ${mediaId}: ${raw}. Осталось PENDING: ${((await this.getTotalPendingSize()) / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      );
    }
  }

  async findAll(): Promise<Media[]> {
    return this.mediaRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['groups'],
    });
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
    if (!media) {
      throw new NotFoundException(`Медиа с id ${id} не найдено`);
    }
    return media;
  }

  /** Все медиа для списка групп (только READY, с ссылкой на CDN) */
  async findByGroupIds(groupIds: string[]): Promise<Media[]> {
    if (groupIds.length === 0) {
      return [];
    }
    // Находим все медиа, которые связаны с хотя бы одной из указанных групп
    const allMedia = await this.mediaRepository.find({
      where: { status: 'READY' },
      relations: ['groups'],
      order: { createdAt: 'DESC' },
    });
    // Фильтруем медиа, которые содержат хотя бы одну из указанных групп
    return allMedia.filter((m) =>
      m.groups.some((g) => groupIds.includes(g.id)),
    );
  }

  async update(id: string, dto: UpdateMediaDto): Promise<Media> {
    const media = await this.findOne(id);
    Object.assign(media, dto);
    return this.mediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);
    await this.mediaRepository.remove(media);
  }
}
