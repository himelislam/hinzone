import type { Types } from 'mongoose';
import type { AuthTokens } from 'shared-types';

import { getTokenExpiry, signAccessToken, signRefreshToken } from '@/config/jwt';
import type { TokenPayload } from '@/config/jwt';
import { settingsService } from '@/modules/settings/settings.service';
import { hashToken } from '@/shared/helpers/hash-token';

import type { UserDocument } from '../users/users.types';

import type { AuthRequestContext } from './auth.types';
import { refreshTokenRepository } from './refresh-token.repository';
import { sessionRepository } from './session.repository';

const toTokenPayload = (user: UserDocument): TokenPayload => ({
  userId: user.id,
  username: user.username,
  role: user.role,
});

const buildTokenResponse = (
  payload: TokenPayload,
  refreshToken: string,
  accessExpiration: string,
): AuthTokens => {
  const accessToken = signAccessToken(payload, accessExpiration);
  const accessExpiresAt = getTokenExpiry(accessToken);
  const expiresIn = Math.max(0, Math.floor((accessExpiresAt.getTime() - Date.now()) / 1000));

  return { accessToken, refreshToken, expiresIn };
};

// Starts a brand new login instance: one Session record plus its first RefreshToken,
// sharing the refresh token's real expiry (decoded from its own `exp` claim) rather
// than a separately configured "session timeout" - see auth.types.ts for why.
// Expirations come from the live Security Settings, not a static env value
// (docs/20-settings-system.md #19) - a server restart is never required to pick
// up an admin's change to either duration.
const startSession = async (
  user: UserDocument,
  context: AuthRequestContext = {},
): Promise<AuthTokens> => {
  const { jwtAccessExpiration, jwtRefreshExpiration } = await settingsService.getSecurity();

  const payload = toTokenPayload(user);
  const refreshToken = signRefreshToken(payload, jwtRefreshExpiration);
  const refreshExpiresAt = getTokenExpiry(refreshToken);

  const session = await sessionRepository.create({
    userId: user._id,
    device: context.device,
    browser: context.browser,
    operatingSystem: context.operatingSystem,
    ipAddress: context.ipAddress,
    expiresAt: refreshExpiresAt,
  });

  await refreshTokenRepository.create({
    userId: user._id,
    sessionId: session._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt,
  });

  return buildTokenResponse(payload, refreshToken, jwtAccessExpiration);
};

// Issues a fresh refresh token for an existing session (docs/07-authentication.md #13
// rotation) - the session itself is preserved, only the token underneath it changes.
const rotateRefreshToken = async (
  user: UserDocument,
  sessionId: Types.ObjectId,
): Promise<AuthTokens> => {
  const { jwtAccessExpiration, jwtRefreshExpiration } = await settingsService.getSecurity();

  const payload = toTokenPayload(user);
  const refreshToken = signRefreshToken(payload, jwtRefreshExpiration);
  const refreshExpiresAt = getTokenExpiry(refreshToken);

  await refreshTokenRepository.create({
    userId: user._id,
    sessionId,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiresAt,
  });

  return buildTokenResponse(payload, refreshToken, jwtAccessExpiration);
};

export const tokenService = {
  startSession,
  rotateRefreshToken,
};
