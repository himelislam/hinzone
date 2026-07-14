import { randomInt } from 'node:crypto';
import { AccountStatus, UserRole } from 'shared-types';

import { signAccessToken } from '@/config/jwt';
import { User } from '@/modules/users/users.model';
import type { IUser, UserDocument } from '@/modules/users/users.types';

export const DEFAULT_TEST_PASSWORD = 'TestPass123!';

let counter = 0;

// Unique per call within a test file (counter) and across parallel-ish runs
// (Date.now()) - avoids unique-index collisions (username/phoneNumber/referralId)
// between test cases without needing a real random-word generator.
export const uniqueUsername = (prefix = 'user'): string => {
  counter += 1;

  return `${prefix}${Date.now().toString(36)}${counter}`.toLowerCase().slice(0, 30);
};

// Matches shared-validation's phoneNumberSchema: 01[3-9]xxxxxxxx (11 digits).
export const uniquePhoneNumber = (): string => `017${randomInt(10000000, 100000000)}`;

export const uniqueReferralId = (): string => `REF${randomInt(100000, 1000000)}`;

export interface RegisterPayloadOverrides {
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  referrerId?: string;
}

export const buildRegisterPayload = (
  overrides: RegisterPayloadOverrides = {},
): Required<Omit<RegisterPayloadOverrides, 'email' | 'referrerId'>> &
  Pick<RegisterPayloadOverrides, 'email' | 'referrerId'> => ({
  fullName: 'Test User',
  username: uniqueUsername(),
  phoneNumber: uniquePhoneNumber(),
  password: DEFAULT_TEST_PASSWORD,
  confirmPassword: DEFAULT_TEST_PASSWORD,
  ...overrides,
});

// Persists a user directly through the Mongoose model (so the pre-save hashing
// hook runs) rather than through the HTTP API - lets integration tests set up
// fixtures (e.g. a locked account, an admin) without a full register+login round
// trip for every test case.
export const createTestUser = async (
  overrides: Partial<IUser> = {},
): Promise<{ user: UserDocument; plainPassword: string }> => {
  const plainPassword = overrides.password ?? DEFAULT_TEST_PASSWORD;

  const user = await User.create({
    fullName: 'Test User',
    username: uniqueUsername(),
    phoneNumber: uniquePhoneNumber(),
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    isVerified: false,
    loginAttempts: 0,
    referralId: uniqueReferralId(),
    joinDate: new Date(),
    ...overrides,
    password: plainPassword,
  });

  return { user, plainPassword };
};

export const createTestAdmin = (
  overrides: Partial<IUser> = {},
): Promise<{ user: UserDocument; plainPassword: string }> =>
  createTestUser({ role: UserRole.ADMIN, ...overrides });

export const buildAccessToken = (user: UserDocument): string =>
  signAccessToken({ userId: user.id, username: user.username, role: user.role });

export const authHeaderFor = (user: UserDocument): string => `Bearer ${buildAccessToken(user)}`;
