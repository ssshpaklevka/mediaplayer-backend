import { Logger } from '@nestjs/common';
import { networkInterfaces } from 'os';

export class StartupConfig {
  private static readonly logger = new Logger('Запуск');

  public static StartupMessage(port: number, name: string): void {
    const localIp =
      Object.values(networkInterfaces())
        .flat()
        .find((i) => i?.family === 'IPv4' && !i?.internal)?.address ||
      'localhost';
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger.log(
      `-------------------------------------------------------------`,
    );
    this.logger.log(`${name} успешно запущен на порту ${port}`);
    if (!isProduction) {
      this.logger.log(
        `Swagger UI доступен по адресу http://${localIp}:${port}/api/docs`,
      );
    }
    this.logger.log(`Базовый URL приложения: http://${localIp}:${port}`);
    this.logger.log(`Окружение: ${isProduction ? 'продакшен' : 'разработка'}`);
    this.logger.log(
      `-------------------------------------------------------------`,
    );
  }
}
