import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DeviceService } from '../device.service';

export type DeviceJwtPayload = { sub: string };

@Injectable()
export class DeviceJwtStrategy extends PassportStrategy(
  Strategy,
  'device-jwt',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly deviceService: DeviceService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>(
        'JWT_DEVICE_SECRET',
        'device-secret-change-me',
      ),
    });
  }

  async validate(payload: DeviceJwtPayload) {
    const deviceId = payload?.sub;
    if (!deviceId) {
      throw new UnauthorizedException('Невалидный токен устройства');
    }
    try {
      const device = await this.deviceService.findOne(deviceId, true);
      return { deviceId: device.id, device };
    } catch {
      throw new UnauthorizedException(
        'Устройство не найдено или токен недействителен',
      );
    }
  }
}
