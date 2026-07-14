import type { AuthTokens } from 'shared-types';

const ACCESS_TOKEN_KEY = 'hinzone.accessToken';
const REFRESH_TOKEN_KEY = 'hinzone.refreshToken';

// Persistence choice: the backend (apps/server/src/modules/auth) never sets an
// httpOnly cookie - POST /auth/refresh and /auth/logout both require the
// refreshToken explicitly in the request body (docs/07-authentication.md #13/#14),
// so the client must be able to read and resend it itself. That rules out an
// httpOnly-cookie strategy without a backend change, which is out of scope here;
// localStorage is the only mechanism that satisfies the backend's actual contract.
// It survives tab close/reopen (unlike sessionStorage) and is readable by
// same-origin JS only - the real mitigation for its XSS exposure is
// middlewares/sanitizeInput.ts and Helmet's CSP, not the storage mechanism itself.
export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = (tokens: AuthTokens): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
