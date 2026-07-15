import { AccountStatus, SettingsCategory, UserRole } from 'shared-types';

import { compareDummyPassword } from '@/config/bcrypt';
import { verifyRefreshToken } from '@/config/jwt';
import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { settingsService } from '@/modules/settings/settings.service';
import { AuthenticationError, NotFoundError } from '@/shared/errors';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import { userRepository } from '../users/users.repository';
import { userService } from '../users/users.service';
import type { UserDocument } from '../users/users.types';

import { authService } from './auth.service';
import { assertPasswordMeetsPolicy } from './password-policy.helpers';
import { refreshTokenRepository } from './refresh-token.repository';
import { sessionRepository } from './session.repository';
import { tokenService } from './token.service';

jest.mock('../users/users.repository');
jest.mock('../users/users.service');
jest.mock('../audit-log/audit-log.repository');
jest.mock('./token.service');
jest.mock('./password-policy.helpers');
jest.mock('./refresh-token.repository');
jest.mock('./session.repository');
jest.mock('@/config/jwt');
jest.mock('@/config/bcrypt');
jest.mock('@/modules/settings/settings.service');

const mockedUserRepository = jest.mocked(userRepository);
const mockedUserService = jest.mocked(userService);
const mockedAuditLogRepository = jest.mocked(auditLogRepository);
const mockedTokenService = jest.mocked(tokenService);
const mockedAssertPasswordMeetsPolicy = jest.mocked(assertPasswordMeetsPolicy);
const mockedRefreshTokenRepository = jest.mocked(refreshTokenRepository);
const mockedSessionRepository = jest.mocked(sessionRepository);
const mockedVerifyRefreshToken = jest.mocked(verifyRefreshToken);
const mockedCompareDummyPassword = jest.mocked(compareDummyPassword);
const mockedSettingsService = jest.mocked(settingsService);

const FAKE_TOKENS = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 };

// The real seeded defaults - handleFailedLogin's maximumLoginAttempts/
// accountLockDurationMinutes come from here now instead of securityConfig.
const SECURITY_SETTINGS = SETTINGS_DEFAULTS[SettingsCategory.SECURITY];

const buildUser = (overrides: Record<string, unknown> = {}): UserDocument =>
  ({
    id: '507f1f77bcf86cd799439011',
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    status: AccountStatus.ACTIVE,
    role: UserRole.USER,
    loginAttempts: 0,
    accountLockedUntil: null,
    comparePassword: jest.fn(),
    ...overrides,
  }) as unknown as UserDocument;

beforeEach(() => {
  jest.clearAllMocks();
  mockedTokenService.startSession.mockResolvedValue(FAKE_TOKENS);
  mockedTokenService.rotateRefreshToken.mockResolvedValue(FAKE_TOKENS);
  mockedAssertPasswordMeetsPolicy.mockResolvedValue(undefined);
  mockedSettingsService.getSecurity.mockResolvedValue(SECURITY_SETTINGS);
  // jest.clearAllMocks() only clears call history, not custom implementations -
  // re-establish the "token is valid" default here so only the test that
  // specifically wants a verification failure needs to override it.
  mockedVerifyRefreshToken.mockReturnValue({
    userId: 'user-id',
    username: 'testuser',
    role: UserRole.USER,
  });
});

describe('register', () => {
  it('validates the sponsor and forwards its id when a referrerId is given', async () => {
    const sponsor = buildUser({ id: 'sponsor-id', _id: 'sponsor-object-id' });
    const newUser = buildUser();
    mockedUserService.validateSponsorExists.mockResolvedValue(sponsor);
    mockedUserService.createUser.mockResolvedValue(newUser);

    await authService.register({
      fullName: 'Test User',
      username: 'testuser',
      phoneNumber: '01712345678',
      password: 'TestPass123!',
      referrerId: 'REF100001',
    });

    expect(mockedUserService.validateSponsorExists).toHaveBeenCalledWith('REF100001');
    expect(mockedUserService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ referrerId: sponsor._id }),
    );
  });

  it('skips sponsor validation when no referrerId is given', async () => {
    mockedUserService.createUser.mockResolvedValue(buildUser());

    await authService.register({
      fullName: 'Test User',
      username: 'testuser',
      phoneNumber: '01712345678',
      password: 'TestPass123!',
    });

    expect(mockedUserService.validateSponsorExists).not.toHaveBeenCalled();
  });

  it('starts a session and logs USER_REGISTERED, returning the user and tokens', async () => {
    const newUser = buildUser();
    mockedUserService.createUser.mockResolvedValue(newUser);

    const result = await authService.register({
      fullName: 'Test User',
      username: 'testuser',
      phoneNumber: '01712345678',
      password: 'TestPass123!',
    });

    expect(mockedTokenService.startSession).toHaveBeenCalledWith(newUser, {});
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      newUser._id,
      AUDIT_ACTIONS.USER_REGISTERED,
      {},
    );
    expect(result).toEqual({ user: newUser, tokens: FAKE_TOKENS });
  });
});

describe('login', () => {
  const LOGIN_INPUT = { login: 'testuser', password: 'TestPass123!' };

  it('runs the dummy password compare and rejects when no account matches (anti-enumeration)', async () => {
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(null);

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(AuthenticationError);

    expect(mockedCompareDummyPassword).toHaveBeenCalledWith(LOGIN_INPUT.password);
  });

  it('rejects a suspended account without comparing the password', async () => {
    const user = buildUser({ status: AccountStatus.SUSPENDED });
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(AuthenticationError);

    expect(user.comparePassword).not.toHaveBeenCalled();
  });

  it('rejects a blocked account without comparing the password', async () => {
    const user = buildUser({ status: AccountStatus.BLOCKED });
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(AuthenticationError);

    expect(user.comparePassword).not.toHaveBeenCalled();
  });

  it('rejects a still-locked account without comparing the password', async () => {
    const user = buildUser({ accountLockedUntil: new Date(Date.now() + 60_000) });
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(/temporarily locked/i);

    expect(user.comparePassword).not.toHaveBeenCalled();
  });

  it('clears a stale (expired) lock before checking the password', async () => {
    const user = buildUser({
      accountLockedUntil: new Date(Date.now() - 60_000),
      loginAttempts: 5,
    });
    (user.comparePassword as jest.Mock).mockResolvedValue(true);
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);
    mockedUserRepository.updateById.mockResolvedValue(user);

    await authService.login(LOGIN_INPUT);

    expect(mockedUserRepository.updateById).toHaveBeenCalledWith(user.id, {
      loginAttempts: 0,
      accountLockedUntil: null,
    });
  });

  it('increments the failed-attempt counter on a wrong password', async () => {
    const user = buildUser();
    (user.comparePassword as jest.Mock).mockResolvedValue(false);
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);
    mockedUserRepository.incrementLoginAttempts.mockResolvedValue(buildUser({ loginAttempts: 1 }));

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(AuthenticationError);

    expect(mockedUserRepository.incrementLoginAttempts).toHaveBeenCalledWith(user.id);
    expect(mockedUserRepository.lockAccountUntil).not.toHaveBeenCalled();
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      user._id,
      AUDIT_ACTIONS.USER_LOGIN_FAILED,
      {},
    );
  });

  it('locks the account once the failed-attempt count reaches the configured maximum', async () => {
    const user = buildUser();
    (user.comparePassword as jest.Mock).mockResolvedValue(false);
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);
    // SECURITY_SETTINGS.maximumLoginAttempts above is 5.
    mockedUserRepository.incrementLoginAttempts.mockResolvedValue(buildUser({ loginAttempts: 5 }));

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(AuthenticationError);

    expect(mockedUserRepository.lockAccountUntil).toHaveBeenCalledWith(user.id, expect.any(Date));
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      user._id,
      AUDIT_ACTIONS.ACCOUNT_LOCKED,
      {},
    );
  });

  it('logs in successfully, resets attempts, and starts a session', async () => {
    const user = buildUser();
    (user.comparePassword as jest.Mock).mockResolvedValue(true);
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);
    const activeUser = buildUser({ lastLogin: new Date() });
    mockedUserRepository.updateById.mockResolvedValue(activeUser);

    const result = await authService.login(LOGIN_INPUT);

    expect(mockedUserRepository.updateById).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({ loginAttempts: 0, accountLockedUntil: null }),
    );
    expect(mockedTokenService.startSession).toHaveBeenCalledWith(activeUser, {});
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      activeUser._id,
      AUDIT_ACTIONS.USER_LOGIN,
      {},
    );
    expect(result).toEqual({ user: activeUser, tokens: FAKE_TOKENS });
  });

  it('throws NotFoundError if the user disappears between password check and the post-login update', async () => {
    const user = buildUser();
    (user.comparePassword as jest.Mock).mockResolvedValue(true);
    mockedUserRepository.findByLoginIdentifier.mockResolvedValue(user);
    mockedUserRepository.updateById.mockResolvedValue(null);

    await expect(authService.login(LOGIN_INPUT)).rejects.toThrow(NotFoundError);
  });
});

describe('refresh', () => {
  const RAW_REFRESH_TOKEN = 'raw-refresh-token';

  it('rejects an invalid or expired JWT before touching the database', async () => {
    mockedVerifyRefreshToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(authService.refresh(RAW_REFRESH_TOKEN)).rejects.toThrow(AuthenticationError);

    expect(mockedRefreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('rejects when no stored refresh token matches', async () => {
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(authService.refresh(RAW_REFRESH_TOKEN)).rejects.toThrow(AuthenticationError);
  });

  it('rejects a revoked refresh token', async () => {
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue({
      revoked: true,
      expiresAt: new Date(Date.now() + 60_000),
      userId: { toString: () => 'user-id' },
      sessionId: 'session-id',
    } as never);

    await expect(authService.refresh(RAW_REFRESH_TOKEN)).rejects.toThrow(AuthenticationError);
  });

  it('rejects an expired refresh token record', async () => {
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue({
      revoked: false,
      expiresAt: new Date(Date.now() - 60_000),
      userId: { toString: () => 'user-id' },
      sessionId: 'session-id',
    } as never);

    await expect(authService.refresh(RAW_REFRESH_TOKEN)).rejects.toThrow(AuthenticationError);
  });

  it('rejects when the owning user no longer exists or is blocked', async () => {
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue({
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      userId: { toString: () => 'user-id' },
      sessionId: 'session-id',
    } as never);
    mockedUserRepository.findById.mockResolvedValue(null);

    await expect(authService.refresh(RAW_REFRESH_TOKEN)).rejects.toThrow(AuthenticationError);
  });

  it('revokes the old token and rotates a new one on success', async () => {
    const user = buildUser();
    const stored = {
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      userId: { toString: (): string => user.id },
      sessionId: 'session-id',
    };
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue(stored as never);
    mockedUserRepository.findById.mockResolvedValue(user);

    const result = await authService.refresh(RAW_REFRESH_TOKEN);

    expect(mockedRefreshTokenRepository.revokeByTokenHash).toHaveBeenCalled();
    expect(mockedTokenService.rotateRefreshToken).toHaveBeenCalledWith(user, stored.sessionId);
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      user._id,
      AUDIT_ACTIONS.REFRESH_TOKEN_ROTATED,
      {},
    );
    expect(result).toEqual(FAKE_TOKENS);
  });
});

describe('logout', () => {
  it('is a no-op for an unknown refresh token', async () => {
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(authService.logout('unknown-token')).resolves.toBeUndefined();

    expect(mockedRefreshTokenRepository.revokeByTokenHash).not.toHaveBeenCalled();
    expect(mockedSessionRepository.revokeById).not.toHaveBeenCalled();
  });

  it('revokes the refresh token and its session, and logs USER_LOGOUT', async () => {
    const stored = { userId: 'user-object-id', sessionId: 'session-id' };
    mockedRefreshTokenRepository.findByTokenHash.mockResolvedValue(stored as never);

    await authService.logout('known-token');

    expect(mockedRefreshTokenRepository.revokeByTokenHash).toHaveBeenCalled();
    expect(mockedSessionRepository.revokeById).toHaveBeenCalledWith('session-id');
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      stored.userId,
      AUDIT_ACTIONS.USER_LOGOUT,
      {},
    );
  });
});
