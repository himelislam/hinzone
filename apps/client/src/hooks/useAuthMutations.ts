import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { AuthResponse, User } from 'shared-types';

import { authService } from '@/services/auth.service';
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth.types';
import { getRefreshToken, setTokens } from '@/utils/token-storage';

import { useAuth } from './useAuth';

const AUTH_QUERY_KEYS = {
  currentUser: ['auth', 'current-user'] as const,
};

export const useCurrentUser = (): UseQueryResult<User, Error> => {
  const { isAuthenticated, setAuthenticatedUser } = useAuth();

  const query = useQuery({
    queryKey: AUTH_QUERY_KEYS.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // useQuery has no onSuccess callback in TanStack Query v5 - this keeps
  // AuthContext's user in sync whenever this query (re)fetches fresh data (e.g.
  // after a profile edit invalidates it elsewhere), so consumers of useAuth() such
  // as a header avatar don't show stale data.
  useEffect(() => {
    if (query.data) {
      setAuthenticatedUser(query.data);
    }
  }, [query.data, setAuthenticatedUser]);

  return query;
};

export const useLogin = (): UseMutationResult<AuthResponse, Error, LoginPayload> => {
  const { setAuthenticatedUser } = useAuth();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: ({ user, tokens }) => {
      setTokens(tokens);
      setAuthenticatedUser(user);
    },
  });
};

export const useRegister = (): UseMutationResult<AuthResponse, Error, RegisterPayload> => {
  const { setAuthenticatedUser } = useAuth();

  return useMutation({
    mutationFn: authService.register,
    onSuccess: ({ user, tokens }) => {
      setTokens(tokens);
      setAuthenticatedUser(user);
    },
  });
};

export const useLogout = (): UseMutationResult<void, Error, void> => {
  const { clearAuth } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    },
    // Clears local state even if the server call fails (e.g. the refresh token was
    // already expired/revoked) - the user's intent to log out of this device
    // should always succeed locally.
    onSettled: clearAuth,
  });
};

export const useForgotPassword = (): UseMutationResult<string, Error, ForgotPasswordPayload> =>
  useMutation({ mutationFn: authService.forgotPassword });

export const useResetPassword = (): UseMutationResult<string, Error, ResetPasswordPayload> =>
  useMutation({ mutationFn: authService.resetPassword });

export const useChangePassword = (): UseMutationResult<string, Error, ChangePasswordPayload> => {
  const { clearAuth } = useAuth();

  // The backend revokes every session on password change, including the current
  // one (modules/auth/password.service.ts's invalidateAllSessions) - clearing
  // local auth state immediately matches that instead of leaving a stale access
  // token usable until its natural expiry.
  return useMutation({
    mutationFn: authService.changePassword,
    onSuccess: clearAuth,
  });
};
