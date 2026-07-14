// Relative to VITE_API_URL (already includes /api/v1 - see .env.example). Shared
// between services/api.ts (401-refresh interceptor) and services/auth.service.ts
// so the two never drift on path strings.
export const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password',
  ME: '/auth/me',
} as const;
