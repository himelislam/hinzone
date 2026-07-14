import { env } from './environment';

export const securityConfig = Object.freeze({
  maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
  accountLockDurationMinutes: env.ACCOUNT_LOCK_DURATION_MINUTES,
  passwordResetTokenExpirationMinutes: env.PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES,
  authRateLimitWindowMinutes: env.AUTH_RATE_LIMIT_WINDOW_MINUTES,
  authRateLimitMaxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
});
