import { ApiProperty } from '@nestjs/swagger';
import {
  IsIP,
  IsString,
  IsUUID,
  IsOptional,
  IsISO8601,
  IsMACAddress,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({
    description: 'MAC-адрес устройства',
    example: 'AA:BB:CC:DD:EE:FF',
  })
  @IsMACAddress({ no_separators: false })
  macAddress: string;

  @ApiProperty({
    description: 'IPv4 или IPv6 адрес устройства',
    example: '192.168.1.1',
  })
  @IsIP()
  ip: string;

  @ApiProperty({
    description: 'Название устройства',
    example: 'Медиаплеер зал',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1, { message: 'name не должно быть пустым' })
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Местоположение устройства',
    example: 'Зал, этаж 1',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1, { message: 'location не должно быть пустым' })
  @MaxLength(255)
  location: string;

  @ApiProperty({
    description: 'UUID группы устройства (устройство находится в одной группе)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'groupId должен быть валидным UUID v4' })
  groupId?: string;

  @ApiProperty({
    description: 'Дата и время последней активности (ISO 8601)',
    example: '2025-02-03T12:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  lastSeen?: string;
}
