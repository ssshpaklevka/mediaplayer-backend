import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';

export class DatabaseConnection {
  static getOptions(config: ConfigService): TypeOrmModuleOptions {
    const isProduction = config.get<string>('NODE_ENV') === 'production';

    return {
      type: 'postgres',
      host: config.get<string>('DB_HOST', 'localhost'),
      port: config.get<number>('DB_PORT', 5432),
      username: config.get<string>('DB_USERNAME', 'postgres'),
      password: config.get<string>('DB_PASSWORD', ''),
      database: config.get<string>('DB_NAME', 'media_player'),
      autoLoadEntities: true,
      synchronize: !isProduction, // В продакшене false, используйте миграции
      ssl:
        config.get<string>('DB_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      logging: config.get<string>('DB_LOGGING') === 'true',
    };
  }
}
