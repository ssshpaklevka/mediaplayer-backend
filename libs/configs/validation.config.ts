import { ValidationPipeOptions } from '@nestjs/common';

export class ValidationConfig {
  public static getOptions(): ValidationPipeOptions {
    return {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    };
  }
}
