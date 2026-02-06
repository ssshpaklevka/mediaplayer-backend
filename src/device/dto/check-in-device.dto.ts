import { ApiProperty } from '@nestjs/swagger';
import { IsMACAddress } from 'class-validator';

export class CheckInDeviceDto {
  @ApiProperty({
    description: 'MAC-адрес устройства (уникальный идентификатор)',
    example: 'AA:BB:CC:DD:EE:FF',
  })
  @IsMACAddress(
    { no_separators: false },
    { message: 'macAddress должен быть валидным MAC-адресом' },
  )
  macAddress: string;
}
