import type { AuthTokens } from 'shared-types';

import { compareDummyPassword } from '@/config/bcrypt';
import { verifyRefreshToken } from '@/config/jwt';
import { settingsService } from '@/modules/settings/settings.service';
import { walletService } from '@/modules/wallet/wallet.service';
import { AuthenticationError, NotFoundError } from '@/shared/errors';
import { hashToken } from '@/shared/helpers/hash-token';

import { userRepository } from '../users/users.repository';
import { userService } from '../users/users.service';
import type { UserDocument } from '../users/users.types';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';

import { isBlockedFromAuth } from './auth.helpers';
import type { AuthRequestContext, LoginInput, RegisterInput } from './auth.types';
import { assertPasswordMeetsPolicy } from './password-policy.helpers';
import { passwordService } from './password.service';
import { refreshTokenRepository } from './refresh-token.repository';
import { sessionRepository } from './session.repository';
import { tokenService } from './token.service';

const register = async (
  input: RegisterInput,
  context: AuthRequestContext = {},
): Promise<{ user: UserDocument; tokens: AuthTokens }> => {
  await assertPasswordMeetsPolicy(input.password);

  const sponsor = input.referrerId
    ? await userService.validateSponsorExists(input.referrerId)
    : undefined;

  const user = await userService.createUser({
    fullName: input.fullName,
    username: input.username,
    email: input.email,
    phoneNumber: input.phoneNumber,
    password: input.password,
    referrerId: sponsor?._id,
  });

  // Wallet creation is not itself a financial operation (backend_rules.md #9's
  // transaction-required list names Deposit/Withdrawal Approval, Stock
  // Purchase/Sale, and Wallet Adjustment - never wallet provisioning), and
  // walletService.createWallet is idempotent, so this runs as a follow-up step
  // rather than inside a MongoDB transaction with the user write above. A real
  // multi-document transaction here would also require MongoDB to run as a
  // replica set, which this platform's current deployment does not.
  const { defaultCurrency } = await settingsService.getCurrency();
  await walletService.createWallet(user.id, defaultCurrency);

  const tokens = await tokenService.startSession(user, context);

  await auditLogRepository.logUserAction(user._id, AUDIT_ACTIONS.USER_REGISTERED, context);

  return { user, tokens };
};

// Isolates login-attempt tracking / account-lock logic so `login` itself stays
// readable. Locking is a second write after the increment rather than one atomic
// update - see users.repository.ts's incrementLoginAttempts for why perfect
// atomicity across both fields isn't warranted for a non-financial operation.
const handleFailedLogin = async (
  user: UserDocument,
  context: AuthRequestContext,
): Promise<void> => {
  const { maximumLoginAttempts, accountLockDurationMinutes } = await settingsService.getSecurity();

  const updated = await userRepository.incrementLoginAttempts(user.id);
  const attempts = updated?.loginAttempts ?? user.loginAttempts + 1;

  if (attempts >= maximumLoginAttempts) {
    const lockedUntil = new Date(Date.now() + accountLockDurationMinutes * 60_000);
    await userRepository.lockAccountUntil(user.id, lockedUntil);
    await auditLogRepository.logUserAction(user._id, AUDIT_ACTIONS.ACCOUNT_LOCKED, context);
  }

  await auditLogRepository.logUserAction(user._id, AUDIT_ACTIONS.USER_LOGIN_FAILED, context);
};

const login = async (
  input: LoginInput,
  context: AuthRequestContext = {},
): Promise<{ user: UserDocument; tokens: AuthTokens }> => {
  const user = await userRepository.findByLoginIdentifier(input.login, { withPassword: true });

  if (!user) {
    // Keeps "no such account" and "wrong password" indistinguishable by response
    // time - otherwise login could be used to enumerate registered identifiers.
    await compareDummyPassword(input.password);
    throw new AuthenticationError('Invalid credentials.');
  }

  if (isBlockedFromAuth(user.status)) {
    throw new AuthenticationError('This account cannot sign in.');
  }

  if (user.accountLockedUntil && user.accountLockedUntil.getTime() > Date.now()) {
    throw new AuthenticationError(
      'This account is temporarily locked due to too many failed sign-in attempts.',
    );
  }

  // A previous lock has expired - clear the stale attempt count so this attempt
  // starts a fresh count instead of immediately re-locking on a single failure.
  if (user.accountLockedUntil) {
    await userRepository.updateById(user.id, { loginAttempts: 0, accountLockedUntil: null });
    user.loginAttempts = 0;
    user.accountLockedUntil = null;
  }

  const passwordMatches = await user.comparePassword(input.password);

  if (!passwordMatches) {
    await handleFailedLogin(user, context);
    throw new AuthenticationError('Invalid credentials.');
  }

  const activeUser = await userRepository.updateById(user.id, {
    loginAttempts: 0,
    accountLockedUntil: null,
    lastLogin: new Date(),
    lastActive: new Date(),
  });

  if (!activeUser) {
    throw new NotFoundError('User not found.');
  }

  const tokens = await tokenService.startSession(activeUser, context);

  await auditLogRepository.logUserAction(activeUser._id, AUDIT_ACTIONS.USER_LOGIN, context);

  return { user: activeUser, tokens };
};

const refresh = async (refreshToken: string, context: AuditContext = {}): Promise<AuthTokens> => {
  try {
    verifyRefreshToken(refreshToken);
  } catch {
    throw new AuthenticationError('Refresh token is invalid or has expired.');
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!stored || stored.revoked || stored.expiresAt.getTime() <= Date.now()) {
    throw new AuthenticationError('Refresh token is invalid or has expired.');
  }

  const user = await userRepository.findById(stored.userId.toString());

  if (!user || isBlockedFromAuth(user.status)) {
    throw new AuthenticationError('Refresh token is invalid or has expired.');
  }

  await refreshTokenRepository.revokeByTokenHash(tokenHash);

  const tokens = await tokenService.rotateRefreshToken(user, stored.sessionId);

  await auditLogRepository.logUserAction(user._id, AUDIT_ACTIONS.REFRESH_TOKEN_ROTATED, context);

  return tokens;
};

// Idempotent: an already-revoked or unknown refresh token is treated as "already
// logged out" rather than an error.
const logout = async (refreshToken: string, context: AuditContext = {}): Promise<void> => {
  const tokenHash = hashToken(refreshToken);
  const stored = await refreshTokenRepository.findByTokenHash(tokenHash);

  if (!stored) {
    return;
  }

  await refreshTokenRepository.revokeByTokenHash(tokenHash);
  await sessionRepository.revokeById(stored.sessionId.toString());

  await auditLogRepository.logUserAction(stored.userId, AUDIT_ACTIONS.USER_LOGOUT, context);
};

const getCurrentUser = async (userId: string): Promise<UserDocument> =>
  userService.getUserById(userId);

export const authService = {
  register,
  login,
  refresh,
  logout,
  forgotPassword: passwordService.forgotPassword,
  resetPassword: passwordService.resetPassword,
  changePassword: passwordService.changePassword,
  revokeAllSessions: passwordService.invalidateAllSessions,
  getCurrentUser,
};
