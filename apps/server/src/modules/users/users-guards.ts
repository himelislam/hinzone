import { ValidationError } from '@/shared/errors';

import { userRepository } from './users.repository';

// Shared by users.service.ts (self-service) and users-admin.service.ts (admin
// management) - split out here purely to keep both files under the 300-line
// Service limit (coding_rules.md #3), not because these guards are a distinct
// domain concern.
export const throwFieldConflict = (path: string, message: string): never => {
  throw new ValidationError(message, [{ path, message }]);
};

export const assertUsernameAvailable = async (username: string): Promise<void> => {
  const existing = await userRepository.findByUsername(username);

  if (existing) {
    throwFieldConflict('username', 'Username is already taken.');
  }
};

export const assertPhoneNumberAvailable = async (
  phoneNumber: string,
  excludeUserId?: string,
): Promise<void> => {
  const existing = await userRepository.findByPhoneNumber(phoneNumber);

  if (existing && existing.id !== excludeUserId) {
    throwFieldConflict('phoneNumber', 'Phone number is already registered.');
  }
};

export const assertEmailAvailable = async (
  email: string,
  excludeUserId?: string,
): Promise<void> => {
  const existing = await userRepository.findByEmail(email);

  if (existing && existing.id !== excludeUserId) {
    throwFieldConflict('email', 'Email is already registered.');
  }
};
