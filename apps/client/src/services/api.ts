import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { ApiSuccessResponse, AuthTokens } from 'shared-types';

import { AUTH_ENDPOINTS } from '@/constants/auth-endpoints.constants';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '@/utils/token-storage';

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Fires once a session can no longer be refreshed (no refresh token, or the
// refresh call itself failed). contexts/AuthContext.tsx subscribes to this so it
// can clear its in-memory user - api.ts is a plain service module with no React
// dependency, so it notifies via this callback instead of importing the context.
let unauthorizedHandler: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

const handleUnauthorized = (): void => {
  clearTokens();
  unauthorizedHandler?.();
};

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
});

// Concurrent requests can all 401 at once (e.g. several queries firing right after
// the access token expires). Sharing one in-flight refresh call instead of firing
// one per request avoids racing the backend's refresh-token rotation
// (docs/07-authentication.md #13) - a second refresh using the now-rotated-away
// token would otherwise fail.
let refreshPromise: Promise<AuthTokens> | null = null;

const refreshAccessToken = (refreshToken: string): Promise<AuthTokens> => {
  refreshPromise ??= apiClient
    .post<ApiSuccessResponse<AuthTokens>>(AUTH_ENDPOINTS.REFRESH, { refreshToken })
    .then((response) => response.data.data)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // The refresh call itself returning 401 means the refresh token is invalid,
    // expired, or revoked - retrying would loop forever.
    if (originalRequest.url === AUTH_ENDPOINTS.REFRESH || originalRequest._retry) {
      handleUnauthorized();
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      handleUnauthorized();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const tokens = await refreshAccessToken(refreshToken);
      setTokens(tokens);
      originalRequest.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      handleUnauthorized();
      return Promise.reject(refreshError instanceof Error ? refreshError : error);
    }
  },
);
