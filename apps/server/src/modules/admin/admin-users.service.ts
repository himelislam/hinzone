import { AccountStatus } from 'shared-types';

import { BusinessRuleError } from '@/shared/errors';

import type { AuditContext } from '../audit-log/audit-log.types';
import { authService } from '../auth/auth.service';
import { userService } from '../users/users.service';
import { usersAdminService } from '../users/users-admin.service';
import type { AdminUpdateUserInput, UserDocument } from '../users/users.types';

// Thin orchestration layer over userService/usersAdminService + authService. It
// exists specifically so that revoking sessions on suspend/block/delete can happen
// without creating a circular dependency: auth.service.ts already depends on
// users.service.ts, so neither users file can depend back on auth's repositories/
// services. This admin module is allowed to depend on both.
const listUsers = usersAdminService.listUsers;
const getUserById = userService.getUserById;

const updateUser = async (
  userId: string,
  input: AdminUpdateUserInput,
  adminId: string,
  context: AuditContext = {},
): Promise<UserDocument> => usersAdminService.updateUserByAdmin(userId, input, adminId, context);

// Suspending/blocking a user must take effect immediately rather than waiting for
// their current access token to expire on its own, so every existing session and
// refresh token is revoked right along with the status change.
const updateUserStatus = async (
  userId: string,
  status: AccountStatus,
  adminId: string,
  context: AuditContext = {},
): Promise<UserDocument> => {
  const user = await usersAdminService.updateUserStatus(userId, status, adminId, context);

  if (status === AccountStatus.SUSPENDED || status === AccountStatus.BLOCKED) {
    await authService.revokeAllSessions(user._id);
  }

  return user;
};

const deleteUser = async (
  userId: string,
  adminId: string,
  context: AuditContext = {},
): Promise<UserDocument> => {
  const user = await usersAdminService.deleteUser(userId, adminId, context);
  await authService.revokeAllSessions(user._id);

  return user;
};

// phase-02's "Reset passwords (future-ready endpoint)" - reuses the existing
// forgot-password token flow rather than inventing a second one; actual delivery
// is deferred the same way regular forgot-password's is (no email/notification
// module yet).
const triggerPasswordReset = async (userId: string): Promise<void> => {
  const user = await userService.getUserById(userId);

  if (!user.email) {
    throw new BusinessRuleError('This user has no email on file to send a password reset to.');
  }

  await authService.forgotPassword(user.email);
};

export const adminUsersService = {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  triggerPasswordReset,
};
