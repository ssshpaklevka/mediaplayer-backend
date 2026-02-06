export interface RateLimitProfile {
  ttl: number;
  limit: number;
}

export class RateLimitConfig {
  private static readonly profiles: Record<string, RateLimitProfile> = {
    strict: { ttl: 60000, limit: 3 }, // 3 запроса в минуту
    short: { ttl: 1000, limit: 5 }, // 5 запросов в секунду
    medium: { ttl: 10000, limit: 20 }, // 20 запросов в 10 секунд
    long: { ttl: 60000, limit: 100 }, // 100 запросов в минуту
    login: { ttl: 900000, limit: 5 }, // 5 попыток в 15 минут
    api: { ttl: 60000, limit: 60 }, // 60 запросов в минуту
  };

  static getProfile(
    profileName: keyof typeof RateLimitConfig.profiles,
  ): RateLimitProfile {
    return this.profiles[profileName];
  }

  static getStrict(): RateLimitProfile {
    return this.profiles.strict;
  }

  static getShort(): RateLimitProfile {
    return this.profiles.short;
  }

  static getMedium(): RateLimitProfile {
    return this.profiles.medium;
  }

  static getLong(): RateLimitProfile {
    return this.profiles.long;
  }

  static getLogin(): RateLimitProfile {
    return this.profiles.login;
  }

  static getApi(): RateLimitProfile {
    return this.profiles.api;
  }

  static getAllProfiles(): Record<string, RateLimitProfile> {
    return { ...this.profiles };
  }
}
