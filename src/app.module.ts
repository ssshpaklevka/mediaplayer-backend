import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentConfig } from '@libs/configs/env.config';
import { DatabaseConnection } from '@libs/connections';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '@libs/guards';
import { DeviceModule } from './device/device.module';
import { GroupModule } from './group/group.module';
import { MediaModule } from './media/media.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    EnvironmentConfig.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) =>
        DatabaseConnection.getOptions(config),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    AuthModule,
    DeviceModule,
    GroupModule,
    MediaModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
