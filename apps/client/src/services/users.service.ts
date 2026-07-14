import type { ApiSuccessResponse, User } from 'shared-types';

import { USERS_ENDPOINTS } from '@/constants/users-endpoints.constants';
import type { UpdateProfilePayload } from '@/types/user.types';

import { apiClient } from './api';

const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
  const response = await apiClient.put<ApiSuccessResponse<User>>(USERS_ENDPOINTS.PROFILE, payload);

  return response.data.data;
};

const uploadProfileImage = async (file: File): Promise<User> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await apiClient.post<ApiSuccessResponse<User>>(
    USERS_ENDPOINTS.PROFILE_IMAGE,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data;
};

export const usersService = {
  updateProfile,
  uploadProfileImage,
};
