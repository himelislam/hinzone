import rateLimit from 'express-rate-limit';

import { securityConfig } from '@/config/security';

// docs/07-authentication.md #27 - e.g. 10 requests/minute/IP on auth endpoints.
export const authRateLimiter = rateLimit({
  windowMs: securityConfig.authRateLimitWindowMinutes * 60_000,
  limit: securityConfig.authRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});
