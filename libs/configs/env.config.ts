import { ConfigModule, ConfigModuleOptions } from '@nestjs/config';

export class EnvironmentConfig {
  private static getConfigModuleOptions(): ConfigModuleOptions {
    return {
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    };
  }

  public static forRoot() {
    return ConfigModule.forRoot(this.getConfigModuleOptions());
  }
}
