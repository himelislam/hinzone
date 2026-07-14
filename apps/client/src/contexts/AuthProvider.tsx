import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import type { User } from 'shared-types';

import { setUnauthorizedHandler } from '@/services/api';
import { authService } from '@/services/auth.service';
import { clearTokens, getRefreshToken } from '@/utils/token-storage';

import { AuthContext, type AuthContextValue } from './auth-context';

interface AuthProviderProps {
  readonly children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  // No refresh token means there is nothing to restore - start "loaded" instead of
  // flipping to false via a synchronous setState in the effect below.
  const [isLoading, setIsLoading] = useState<boolean>(() => getRefreshToken() !== null);

  const clearAuth = useCallback((): void => {
    clearTokens();
    setUser(null);
  }, []);

  const setAuthenticatedUser = useCallback((nextUser: User): void => {
    setUser(nextUser);
  }, []);

  // apiClient's response interceptor (services/api.ts) calls this when a session
  // can no longer be refreshed, so the in-memory user is cleared even for requests
  // fired outside of a TanStack Query hook.
  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    return (): void => setUnauthorizedHandler(null);
  }, [clearAuth]);

  // A refresh token surviving a reload means a session may still be restorable -
  // if the stored access token has since expired, apiClient's request/response
  // interceptors transparently refresh it before this call resolves.
  useEffect(() => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      return;
    }

    authService
      .getCurrentUser()
      .then(setUser)
      .catch(() => {
        // Deliberately does not clear tokens here: a genuine "session can't be
        // refreshed" failure is already handled by apiClient's response
        // interceptor via setUnauthorizedHandler (registered above), which calls
        // clearAuth (clears tokens + user) only once refresh itself has failed.
        // A rejection reaching this catch can also be a transient network/CORS/
        // 5xx error unrelated to the session's validity - clearing a still-valid
        // refresh token on a temporary failure would sign the user out for no
        // real reason.
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      setAuthenticatedUser,
      clearAuth,
    }),
    [user, isLoading, setAuthenticatedUser, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
