import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { User } from 'shared-types';

import { usersService } from '@/services/users.service';
import type { UpdateProfilePayload } from '@/types/user.types';

import { useAuth } from './useAuth';

// Both mutations write directly to the same User the AuthContext already holds -
// syncing the response back in keeps a header avatar or nav greeting from ever
// showing stale data (same pattern as useAuthMutations.ts's useCurrentUser).
export const useUpdateProfile = (): UseMutationResult<User, Error, UpdateProfilePayload> => {
  const { setAuthenticatedUser } = useAuth();

  return useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: setAuthenticatedUser,
  });
};

export const useUploadProfileImage = (): UseMutationResult<User, Error, File> => {
  const { setAuthenticatedUser } = useAuth();

  return useMutation({
    mutationFn: usersService.uploadProfileImage,
    onSuccess: setAuthenticatedUser,
  });
};
