import { ApiProperty } from '@nestjs/swagger';

export class DeviceRo {
  @ApiProperty({
    description: 'UUID устройства',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  id: string;

  @ApiProperty({
    description: 'MAC-адрес устройства (уникальный идентификатор)',
    example: 'AA:BB:CC:DD:EE:FF',
  })
  macAddress: string;

  @ApiProperty({
    description: 'IP адрес устройства',
    example: '192.168.1.1',
  })
  ip: string;

  @ApiProperty({
    description: 'Название устройства',
    example: 'Медиаплеер зал',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    description: 'Местоположение устройства',
    example: 'Зал, этаж 1',
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: 'Группа устройства (id, название, включена)',
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
      name: { type: 'string', example: 'Зал' },
      enabled: { type: 'boolean', example: true },
    },
  })
  group: { id: string; name: string; enabled: boolean } | null;

  @ApiProperty({
    description: 'Дата и время последней активности',
    example: '2025-02-03T12:00:00.000Z',
    nullable: true,
  })
  lastSeen: string | null;
}
