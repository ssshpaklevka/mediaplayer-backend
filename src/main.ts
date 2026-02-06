import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  CorsConfig,
  StartupConfig,
  SwaggerConfig,
  ValidationConfig,
} from '@libs/configs';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const PORT = configService.getOrThrow<number>('PORT');

  app.setGlobalPrefix('api');
  app.enableCors(new CorsConfig(configService).getCorsOptions());
  app.useGlobalPipes(new ValidationPipe(ValidationConfig.getOptions()));

  new SwaggerConfig(configService).setup(app);

  await app.listen(PORT);

  StartupConfig.StartupMessage(PORT, 'Гейтвей');
}

bootstrap();
