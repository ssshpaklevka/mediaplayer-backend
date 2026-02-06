import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export type AdminJwtPayload = { sub: string };

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ADMIN_SECRET',
        'admin-secret-change-me',
      ),
    });
  }

  validate(payload: AdminJwtPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Невалидный токен админа');
    }
    return { username: payload.sub };
  }
}
