import { env } from './environment';

// maxLoginAttempts/accountLockDurationMinutes/passwordResetTokenExpirationMinutes
// moved to SecuritySettings (settingsService.getSecurity()) - rate limiting isn't
// part of SecuritySettings (docs/20-settings-system.md #19), so it stays here.
export const securityConfig = Object.freeze({
  authRateLimitWindowMinutes: env.AUTH_RATE_LIMIT_WINDOW_MINUTES,
  authRateLimitMaxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
});
