import { randomBytes } from 'node:crypto';
import type { Types } from 'mongoose';

import { settingsService } from '@/modules/settings/settings.service';
import { AuthenticationError, NotFoundError } from '@/shared/errors';
import { hashToken } from '@/shared/helpers/hash-token';

import { userRepository } from '../users/users.repository';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';

import { isBlockedFromAuth } from './auth.helpers';
import { assertPasswordMeetsPolicy } from './password-policy.helpers';
import { passwordResetTokenRepository } from './password-reset-token.repository';
import { refreshTokenRepository } from './refresh-token.repository';
import { sessionRepository } from './session.repository';

const RESET_TOKEN_BYTES = 32;

// Every existing refresh token/session for the user is invalidated after a password
// change or reset, per docs/07-authentication.md #20 - the user must sign in again
// everywhere with the new password.
const invalidateAllSessions = async (userId: Types.ObjectId): Promise<void> => {
  await refreshTokenRepository.revokeAllForUser(userId);
  await sessionRepository.deleteAllForUser(userId);
};

// Deliberately returns null (rather than throwing) for both "no such email" and
// "account not eligible" - the caller must respond identically either way so a
// forgot-password form can't be used to enumerate registered emails or account
// status.
const forgotPassword = async (
  email: string,
  context: AuditContext = {},
): Promise<string | null> => {
  const user = await userRepository.findByEmail(email);

  if (!user || isBlockedFromAuth(user.status)) {
    return null;
  }

  const { passwordResetTokenExpirationMinutes } = await settingsService.getSecurity();
  const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + passwordResetTokenExpirationMinutes * 60_000);

  await passwordResetTokenRepository.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt,
  });

  await auditLogRepository.logUserAction(user._id, AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED, context);

  return rawToken;
};

const resetPassword = async (
  resetToken: string,
  newPassword: string,
  context: AuditContext = {},
): Promise<void> => {
  const tokenHash = hashToken(resetToken);
  const stored = await passwordResetTokenRepository.findByTokenHash(tokenHash);

  if (!stored || stored.used || stored.expiresAt.getTime() <= Date.now()) {
    throw new AuthenticationError('Reset token is invalid or has expired.');
  }

  await assertPasswordMeetsPolicy(newPassword);

  const userId = stored.userId;

  await userRepository.updatePassword(userId.toString(), newPassword);
  await passwordResetTokenRepository.markUsed(tokenHash);
  await invalidateAllSessions(userId);

  await auditLogRepository.logUserAction(userId, AUDIT_ACTIONS.PASSWORD_RESET, context);
};

const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
  context: AuditContext = {},
): Promise<void> => {
  const user = await userRepository.findById(userId, { withPassword: true });

  if (!user) {
    throw new NotFoundError('User not found.');
  }

  if (isBlockedFromAuth(user.status)) {
    throw new AuthenticationError('This account cannot perform this action.');
  }

  const currentPasswordMatches = await user.comparePassword(currentPassword);

  if (!currentPasswordMatches) {
    throw new AuthenticationError('Current password is incorrect.');
  }

  await assertPasswordMeetsPolicy(newPassword);

  await userRepository.updatePassword(userId, newPassword);
  await invalidateAllSessions(user._id);

  await auditLogRepository.logUserAction(user._id, AUDIT_ACTIONS.PASSWORD_CHANGED, context);
};

export const passwordService = {
  forgotPassword,
  resetPassword,
  changePassword,
  // Exposed for modules/admin, which needs to force-logout a user it just
  // suspended/blocked/deleted. users.service.ts cannot call refreshTokenRepository/
  // sessionRepository directly (they live in this module, and auth.service.ts
  // already imports from users.service.ts - that would be circular), so the admin
  // module is the layer allowed to depend on both.
  invalidateAllSessions,
};
