import type { QueryFilter } from 'mongoose';
import { Types } from 'mongoose';
import { AccountStatus } from 'shared-types';

import { NotFoundError } from '@/shared/errors';
import { escapeRegExp } from '@/shared/helpers/escape-regex';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';

import { userRepository } from './users.repository';
import { userService } from './users.service';
import type {
  AdminUpdateUserInput,
  AdminUserListFilters,
  IUser,
  PaginatedUsers,
  PaginationOptions,
  UserDocument,
} from './users.types';
import { assertEmailAvailable, assertPhoneNumberAvailable } from './users-guards';

// Soft-deleted users are excluded by default - phase-02's admin capabilities are
// "view/search/filter users", not "view deleted users"; direct getUserById lookups
// (self-service profile, admin get-by-id) deliberately do not apply this filter.
const listUsers = async (
  options: PaginationOptions,
  filters: AdminUserListFilters = {},
): Promise<PaginatedUsers> => {
  const query: QueryFilter<IUser> = { isDeleted: { $ne: true } };

  if (filters.search) {
    const pattern = new RegExp(escapeRegExp(filters.search), 'i');
    query.$or = [
      { fullName: pattern },
      { username: pattern },
      { email: pattern },
      { phoneNumber: pattern },
    ];
  }

  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    const range: { $gte?: Date; $lte?: Date } = {};

    if (filters.dateFrom) {
      range.$gte = filters.dateFrom;
    }

    if (filters.dateTo) {
      range.$lte = filters.dateTo;
    }

    query.createdAt = range;
  }

  return userRepository.list(options, query);
};

const updateUserByAdmin = async (
  userId: string,
  input: AdminUpdateUserInput,
  adminId: string,
  context: AuditContext = {},
): Promise<UserDocument> => {
  const updates: AdminUpdateUserInput = {};

  if (input.fullName !== undefined) {
    updates.fullName = input.fullName;
  }

  if (input.email !== undefined) {
    const email = input.email.trim() || undefined;

    if (email) {
      await assertEmailAvailable(email, userId);
    }

    updates.email = email;
  }

  if (input.phoneNumber !== undefined) {
    await assertPhoneNumberAvailable(input.phoneNumber, userId);
    updates.phoneNumber = input.phoneNumber;
  }

  if (input.profileImage !== undefined) {
    updates.profileImage = input.profileImage;
  }

  if (input.role !== undefined) {
    updates.role = input.role;
  }

  if (Object.keys(updates).length === 0) {
    return userService.getUserById(userId);
  }

  const updated = await userRepository.updateById(userId, updates);

  if (!updated) {
    throw new NotFoundError('User not found.');
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.ADMIN_USER_UPDATED,
    entity: 'User',
    entityId: userId,
    after: updates,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

const updateUserStatus = async (
  userId: string,
  status: AccountStatus,
  adminId: string,
  context: AuditContext = {},
): Promise<UserDocument> => {
  const target = await userService.getUserById(userId);
  const previousStatus = target.status;

  const updated = await userRepository.updateById(userId, { status });

  if (!updated) {
    throw new NotFoundError('User not found.');
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.ADMIN_USER_STATUS_CHANGED,
    entity: 'User',
    entityId: userId,
    before: { status: previousStatus },
    after: { status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

// Soft delete (database_rules.md #15) - also forces the account into BLOCKED so
// every existing authentication check (login, refresh, change-password) that
// already gates on status keeps a deleted user out, without those flows needing
// to separately know about isDeleted.
const deleteUser = async (
  userId: string,
  adminId: string,
  context: AuditContext = {},
): Promise<UserDocument> => {
  const target = await userService.getUserById(userId);

  const updated = await userRepository.updateById(userId, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: new Types.ObjectId(adminId),
    status: AccountStatus.BLOCKED,
  });

  if (!updated) {
    throw new NotFoundError('User not found.');
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.ADMIN_USER_DELETED,
    entity: 'User',
    entityId: userId,
    before: { isDeleted: false, status: target.status },
    after: { isDeleted: true, status: AccountStatus.BLOCKED },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

export const usersAdminService = {
  listUsers,
  updateUserByAdmin,
  updateUserStatus,
  deleteUser,
};
