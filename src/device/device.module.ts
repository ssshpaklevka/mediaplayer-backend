import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { Device } from './entities/device.entity';
import { Group } from '../group/entities/group.entity';
import { DeviceJwtStrategy } from './strategies/device-jwt.strategy';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, Group]),
    PassportModule.register({ defaultStrategy: 'device-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_DEVICE_SECRET',
          'device-secret-change-me',
        ),
        signOptions: {}, // без expiresIn — токен действует «всю жизнь»
      }),
      inject: [ConfigService],
    }),
    MediaModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService, DeviceJwtStrategy],
  exports: [DeviceService],
})
export class DeviceModule {}
