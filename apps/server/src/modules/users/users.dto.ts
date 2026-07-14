import type { User } from 'shared-types';

import type { UserDocument } from './users.types';

// Maps the internal Mongoose document to the exact client-safe shape shared with the
// frontend. The model's own `select: false` + toJSON transform already keep the
// password hash out of raw serialization, but this mapper is what actually
// guarantees the response matches the `User` contract field-for-field (id vs _id,
// ISO date strings vs Date objects, referrerId as a string, etc).
export const toUserResponse = (user: UserDocument): User => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  status: user.status,
  profileImage: user.profileImage,
  referralId: user.referralId,
  referrerId: user.referrerId?.toString(),
  isVerified: user.isVerified,
  loginAttempts: user.loginAttempts,
  accountLockedUntil: user.accountLockedUntil ? user.accountLockedUntil.toISOString() : null,
  lastLogin: user.lastLogin?.toISOString(),
  lastActive: user.lastActive?.toISOString(),
  joinDate: user.joinDate.toISOString(),
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
