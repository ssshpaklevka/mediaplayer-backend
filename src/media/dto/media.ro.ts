import { ApiProperty } from '@nestjs/swagger';

export class MediaRo {
  @ApiProperty({ description: 'UUID медиа' })
  id: string;

  @ApiProperty({
    description: 'UUID групп, к которым привязано медиа',
    type: [String],
  })
  groupIds: string[];

  @ApiProperty({ description: 'Ссылка на CDN (после конвертации)', nullable: true })
  url: string | null;

  @ApiProperty({ description: 'Название', nullable: true })
  name: string | null;

  @ApiProperty({
    description: 'PENDING=в очереди, READY=доступно, FAILED=ошибка',
    enum: ['PENDING', 'READY', 'FAILED'],
  })
  status: string;

  @ApiProperty({ description: 'Ошибка обработки', nullable: true })
  processingError: string | null;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: string;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: string;
}
