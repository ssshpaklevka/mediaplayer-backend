import { Throttle } from '@nestjs/throttler';
import { RateLimitConfig } from '@libs/configs';

export class RateLimit {
  static profile(profileName: keyof typeof RateLimitConfig) {
    const profile = RateLimitConfig.getProfile(profileName);
    return Throttle({ default: profile });
  }
  static strict() {
    return Throttle({ default: RateLimitConfig.getStrict() });
  }
  static short() {
    return Throttle({ default: RateLimitConfig.getShort() });
  }
  static medium() {
    return Throttle({ default: RateLimitConfig.getMedium() });
  }
  static long() {
    return Throttle({ default: RateLimitConfig.getLong() });
  }
  static login() {
    return Throttle({ default: RateLimitConfig.getLogin() });
  }
  static api() {
    return Throttle({ default: RateLimitConfig.getApi() });
  }
}
