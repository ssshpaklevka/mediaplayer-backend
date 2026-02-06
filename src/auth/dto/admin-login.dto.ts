import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ description: 'Логин админа', example: 'admin' })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({ description: 'Пароль', example: '***' })
  @IsString()
  @MinLength(1)
  password: string;
}
