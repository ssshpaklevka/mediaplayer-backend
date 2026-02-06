import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiExtraModels,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DeviceService } from './device.service';
import { MediaService } from '../media/media.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CheckInDeviceDto } from './dto/check-in-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceRo } from './dto/device.ro';
import { toDeviceRo } from './mappers/device.mapper';
import { DeviceJwtAuthGuard } from './guards/device-jwt-auth.guard';
import { AdminJwtAuthGuard } from '../auth/guards/admin-jwt-auth.guard';

/** Нормализует IP: ::1 → 127.0.0.1, ::ffff:192.168.1.1 → 192.168.1.1 */
function normalizeClientIp(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '::1') {
    return '127.0.0.1';
  }
  return trimmed.replace(/^::ffff:/i, '');
}

@ApiTags('device')
@ApiExtraModels(DeviceRo)
@Controller('device')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly mediaService: MediaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Post('check-in')
  @ApiOperation({
    summary: 'Чек-ин устройства',
    description:
      'Устройство отправляет MAC. Если устройство верифицировано (назначена группа) — 200 + JWT. Иначе 401 (в списке на рассмотрение).',
  })
  @ApiBody({ type: CheckInDeviceDto })
  @ApiResponse({
    status: 200,
    description: 'Устройство верифицировано, выдан JWT',
    schema: { properties: { accessToken: { type: 'string' } } },
  })
  @ApiResponse({
    status: 401,
    description: 'Устройство в списке на рассмотрение (ожидает группу)',
  })
  async checkIn(@Body() dto: CheckInDeviceDto, @Req() req: Request) {
    const raw =
      req.ip ??
      req.headers['x-forwarded-for']?.toString().split(',')[0] ??
      req.socket?.remoteAddress ??
      '';
    const ip = normalizeClientIp(raw);
    const { device, verified } = await this.deviceService.checkIn(
      dto.macAddress,
      ip,
    );
    if (!verified) {
      throw new UnauthorizedException('Устройство ожидает назначения группы');
    }
    const secret = this.configService.get<string>(
      'JWT_DEVICE_SECRET',
      'device-secret-change-me',
    );
    const accessToken = this.jwtService.sign({ sub: device.id }, { secret });
    return { accessToken };
  }

  @Get('me/media')
  @UseGuards(DeviceJwtAuthGuard)
  @ApiBearerAuth('device-jwt')
  @ApiOperation({
    summary: 'Медиа для устройства',
    description:
      'По JWT берётся устройство, из него — включённые группы. Возвращаются все медиа (ссылки) этих групп. Невалидный токен — 401.',
  })
  @ApiResponse({
    status: 200,
    description: 'Список медиа (ссылок) для групп устройства',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          url: { type: 'string' },
          name: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Токен невалиден или устройство не найдено',
  })
  async getMyMedia(
    @Req()
    req: Request & {
      user: { device: { group: { id: string; enabled: boolean } | null } };
    },
  ) {
    const device = req.user?.device;
    // Устройство в одной группе, проверяем что она включена
    if (!device.group || !device.group.enabled) {
      return [];
    }
    const mediaList = await this.mediaService.findByGroupIds([device.group.id]);
    return mediaList.map((m) => ({
      id: m.id,
      url: m.url,
      name: m.name,
    }));
  }

  @Post()
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Создать устройство (только админ)' })
  @ApiBody({ type: CreateDeviceDto })
  @ApiResponse({
    status: 201,
    description: 'Устройство создано',
    type: DeviceRo,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async create(@Body() createDeviceDto: CreateDeviceDto): Promise<DeviceRo> {
    const entity = await this.deviceService.create(createDeviceDto);
    return toDeviceRo(entity);
  }

  @Get()
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Список устройств (только админ)' })
  @ApiResponse({
    status: 200,
    description: 'Список устройств',
    type: [DeviceRo],
  })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async findAll(): Promise<DeviceRo[]> {
    const list = await this.deviceService.findAll();
    return list.map(toDeviceRo);
  }

  @Get(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Устройство по id (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID устройства' })
  @ApiResponse({ status: 200, description: 'Устройство', type: DeviceRo })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DeviceRo> {
    const entity = await this.deviceService.findOne(id);
    return toDeviceRo(entity);
  }

  @Patch(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Обновить устройство (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID устройства' })
  @ApiBody({ type: UpdateDeviceDto })
  @ApiResponse({
    status: 200,
    description: 'Устройство обновлено',
    type: DeviceRo,
  })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceRo> {
    const entity = await this.deviceService.update(id, updateDeviceDto);
    return toDeviceRo(entity);
  }

  @Delete(':id')
  @UseGuards(AdminJwtAuthGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOperation({ summary: 'Удалить устройство (только админ)' })
  @ApiParam({ name: 'id', description: 'UUID устройства' })
  @ApiResponse({ status: 204, description: 'Устройство удалено' })
  @ApiResponse({ status: 404, description: 'Устройство не найдено' })
  @ApiResponse({ status: 401, description: 'Требуется авторизация админа' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.deviceService.remove(id);
  }
}
