import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsUrl,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';

export class CreateMediaDto {
  @ApiProperty({
    description:
      'UUID групп, к которым привязано медиа (медиа может быть в нескольких группах)',
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440001',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: 'каждый groupId должен быть валидным UUID v4',
  })
  groupIds: string[];

  @ApiProperty({
    description:
      'Прямая ссылка на файл (для создания по ссылке; для загрузки файла используйте POST /media/upload)',
    example: 'https://example.com/video.mp4',
    maxLength: 2048,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  url?: string;

  @ApiProperty({
    description: 'Название медиа',
    example: 'Рекламный ролик',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;
}
