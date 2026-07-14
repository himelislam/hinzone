import { AccountStatus, UserRole } from 'shared-types';

import { AuthenticationError, NotFoundError } from '@/shared/errors';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import { userRepository } from '../users/users.repository';
import type { UserDocument } from '../users/users.types';

import { passwordResetTokenRepository } from './password-reset-token.repository';
import { passwordService } from './password.service';
import { refreshTokenRepository } from './refresh-token.repository';
import { sessionRepository } from './session.repository';

jest.mock('../users/users.repository');
jest.mock('../audit-log/audit-log.repository');
jest.mock('./password-reset-token.repository');
jest.mock('./refresh-token.repository');
jest.mock('./session.repository');

const mockedUserRepository = jest.mocked(userRepository);
const mockedAuditLogRepository = jest.mocked(auditLogRepository);
const mockedResetTokenRepository = jest.mocked(passwordResetTokenRepository);
const mockedRefreshTokenRepository = jest.mocked(refreshTokenRepository);
const mockedSessionRepository = jest.mocked(sessionRepository);

const buildUser = (overrides: Record<string, unknown> = {}): UserDocument =>
  ({
    id: '507f1f77bcf86cd799439011',
    _id: '507f1f77bcf86cd799439011',
    status: AccountStatus.ACTIVE,
    role: UserRole.USER,
    comparePassword: jest.fn(),
    ...overrides,
  }) as unknown as UserDocument;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('forgotPassword', () => {
  it('returns null for an unknown email without creating a reset token (anti-enumeration)', async () => {
    mockedUserRepository.findByEmail.mockResolvedValue(null);

    await expect(passwordService.forgotPassword('nobody@example.com')).resolves.toBeNull();

    expect(mockedResetTokenRepository.create).not.toHaveBeenCalled();
  });

  it('returns null for a blocked account without creating a reset token', async () => {
    const user = buildUser({ status: AccountStatus.BLOCKED });
    mockedUserRepository.findByEmail.mockResolvedValue(user);

    await expect(passwordService.forgotPassword('blocked@example.com')).resolves.toBeNull();

    expect(mockedResetTokenRepository.create).not.toHaveBeenCalled();
  });

  it('creates a reset token and logs the request for an eligible account', async () => {
    const user = buildUser();
    mockedUserRepository.findByEmail.mockResolvedValue(user);

    const rawToken = await passwordService.forgotPassword('user@example.com');

    expect(typeof rawToken).toBe('string');
    expect(rawToken).toHaveLength(64); // 32 bytes, hex-encoded
    expect(mockedResetTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: user._id }),
    );
    const createCall = mockedResetTokenRepository.create.mock.calls[0]?.[0];
    expect(createCall?.expiresAt).toBeInstanceOf(Date);
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      user._id,
      AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      {},
    );
  });
});

describe('resetPassword', () => {
  it('rejects an unknown token', async () => {
    mockedResetTokenRepository.findByTokenHash.mockResolvedValue(null);

    await expect(passwordService.resetPassword('bad-token', 'NewPass123!')).rejects.toThrow(
      AuthenticationError,
    );
  });

  it('rejects an already-used token', async () => {
    mockedResetTokenRepository.findByTokenHash.mockResolvedValue({
      used: true,
      expiresAt: new Date(Date.now() + 60_000),
      userId: 'user-id',
    } as never);

    await expect(passwordService.resetPassword('used-token', 'NewPass123!')).rejects.toThrow(
      AuthenticationError,
    );
  });

  it('rejects an expired token', async () => {
    mockedResetTokenRepository.findByTokenHash.mockResolvedValue({
      used: false,
      expiresAt: new Date(Date.now() - 60_000),
      userId: 'user-id',
    } as never);

    await expect(passwordService.resetPassword('expired-token', 'NewPass123!')).rejects.toThrow(
      AuthenticationError,
    );
  });

  it('updates the password, marks the token used, and invalidates every session', async () => {
    const stored = { used: false, expiresAt: new Date(Date.now() + 60_000), userId: 'user-id' };
    mockedResetTokenRepository.findByTokenHash.mockResolvedValue(stored as never);

    await passwordService.resetPassword('valid-token', 'NewPass123!');

    expect(mockedUserRepository.updatePassword).toHaveBeenCalledWith('user-id', 'NewPass123!');
    expect(mockedResetTokenRepository.markUsed).toHaveBeenCalled();
    expect(mockedRefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(stored.userId);
    expect(mockedSessionRepository.deleteAllForUser).toHaveBeenCalledWith(stored.userId);
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      stored.userId,
      AUDIT_ACTIONS.PASSWORD_RESET,
      {},
    );
  });
});

describe('changePassword', () => {
  it('throws NotFoundError when the user does not exist', async () => {
    mockedUserRepository.findById.mockResolvedValue(null);

    await expect(
      passwordService.changePassword('missing-id', 'Current123!', 'NewPass123!'),
    ).rejects.toThrow(NotFoundError);
  });

  it('rejects for a blocked account', async () => {
    const user = buildUser({ status: AccountStatus.BLOCKED });
    mockedUserRepository.findById.mockResolvedValue(user);

    await expect(
      passwordService.changePassword(user.id, 'Current123!', 'NewPass123!'),
    ).rejects.toThrow(AuthenticationError);
  });

  it('rejects when the current password is incorrect', async () => {
    const user = buildUser();
    (user.comparePassword as jest.Mock).mockResolvedValue(false);
    mockedUserRepository.findById.mockResolvedValue(user);

    await expect(
      passwordService.changePassword(user.id, 'WrongCurrent1!', 'NewPass123!'),
    ).rejects.toThrow(AuthenticationError);

    expect(mockedUserRepository.updatePassword).not.toHaveBeenCalled();
  });

  it('updates the password and invalidates every session, including this one', async () => {
    const user = buildUser();
    (user.comparePassword as jest.Mock).mockResolvedValue(true);
    mockedUserRepository.findById.mockResolvedValue(user);

    await passwordService.changePassword(user.id, 'Current123!', 'NewPass123!');

    expect(mockedUserRepository.updatePassword).toHaveBeenCalledWith(user.id, 'NewPass123!');
    expect(mockedRefreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith(user._id);
    expect(mockedSessionRepository.deleteAllForUser).toHaveBeenCalledWith(user._id);
    expect(mockedAuditLogRepository.logUserAction).toHaveBeenCalledWith(
      user._id,
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      {},
    );
  });
});
