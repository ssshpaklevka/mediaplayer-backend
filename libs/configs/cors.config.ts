import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CorsConfig {
  constructor(private readonly configService: ConfigService) {}

  public getCorsOptions(): CorsOptions {
    return {
      origin: this.configService.get<string[]>('CORS_ORIGINS') || '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
      exposedHeaders: [],
      credentials: true,
    };
  }
}
