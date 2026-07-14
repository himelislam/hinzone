import type { ApiSuccessResponse, AuthResponse, AuthTokens, User } from 'shared-types';

import { AUTH_ENDPOINTS } from '@/constants/auth-endpoints.constants';
import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth.types';

import { apiClient } from './api';

const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
    AUTH_ENDPOINTS.REGISTER,
    payload,
  );

  return response.data.data;
};

const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
    AUTH_ENDPOINTS.LOGIN,
    payload,
  );

  return response.data.data;
};

const refresh = async (refreshToken: string): Promise<AuthTokens> => {
  const response = await apiClient.post<ApiSuccessResponse<AuthTokens>>(AUTH_ENDPOINTS.REFRESH, {
    refreshToken,
  });

  return response.data.data;
};

const logout = async (refreshToken: string): Promise<string> => {
  const response = await apiClient.post<ApiSuccessResponse<null>>(AUTH_ENDPOINTS.LOGOUT, {
    refreshToken,
  });

  return response.data.message;
};

const forgotPassword = async (payload: ForgotPasswordPayload): Promise<string> => {
  const response = await apiClient.post<ApiSuccessResponse<null>>(
    AUTH_ENDPOINTS.FORGOT_PASSWORD,
    payload,
  );

  return response.data.message;
};

const resetPassword = async (payload: ResetPasswordPayload): Promise<string> => {
  const response = await apiClient.post<ApiSuccessResponse<null>>(
    AUTH_ENDPOINTS.RESET_PASSWORD,
    payload,
  );

  return response.data.message;
};

const changePassword = async (payload: ChangePasswordPayload): Promise<string> => {
  const response = await apiClient.put<ApiSuccessResponse<null>>(
    AUTH_ENDPOINTS.CHANGE_PASSWORD,
    payload,
  );

  return response.data.message;
};

const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<ApiSuccessResponse<User>>(AUTH_ENDPOINTS.ME);

  return response.data.data;
};

export const authService = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
};
