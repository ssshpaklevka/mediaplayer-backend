import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';

export class SwaggerConfig {
  private readonly PORT: number;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.PORT = this.configService.getOrThrow<number>('PORT');
    this.isProduction =
      this.configService.getOrThrow<string>('NODE_ENV') === 'production';
  }

  private getDocumentConfig() {
    return new DocumentBuilder()
      .setTitle('Медиа сервис документация')
      .setDescription('Описание')
      .setVersion('Версия')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'admin-jwt',
          in: 'header',
        },
        'admin-jwt',
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'device-jwt',
          in: 'header',
        },
        'device-jwt',
      )
      .addServer('https://api.production.com', 'Продакшен сервер')
      .addServer(`https://api.development.com`, 'Девелопмент сервер')
      .addServer(`http://localhost:${this.PORT}`, 'Локальный сервер')
      .build();
  }

  private createDocument(app: INestApplication): OpenAPIObject {
    const config = this.getDocumentConfig();
    return SwaggerModule.createDocument(app, config, {
      extraModels: [],
    });
  }

  public setup(app: INestApplication, path: string = 'api/docs'): void {
    const document = this.createDocument(app);
    SwaggerModule.setup(path, app, document);
  }
}
