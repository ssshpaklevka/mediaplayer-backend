import { ApiProperty } from '@nestjs/swagger';

export class GroupRo {
  @ApiProperty({
    description: 'UUID группы',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({ description: 'Название группы', example: 'Зал' })
  name: string;

  @ApiProperty({ description: 'Группа включена', example: true })
  enabled: boolean;

  @ApiProperty({ description: 'Дата создания' })
  createdAt: string;

  @ApiProperty({ description: 'Дата обновления' })
  updatedAt: string;
}
