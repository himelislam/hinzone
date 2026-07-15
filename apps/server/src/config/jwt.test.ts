import jsonwebtoken from 'jsonwebtoken';
import { UserRole } from 'shared-types';

import {
  getTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';
import type { TokenPayload } from './jwt';

const PAYLOAD: TokenPayload = {
  userId: '507f1f77bcf86cd799439011',
  username: 'johndoe',
  role: UserRole.USER,
};

// Expiration is passed in by the caller (token.service.ts, from the live Security
// Settings) rather than read internally - these are just fixed literals for this
// file's own sign/verify round-trip assertions, matching SETTINGS_DEFAULTS'
// security category values.
const ACCESS_EXPIRATION = '15m';
const REFRESH_EXPIRATION = '7d';

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips a payload through sign and verify', () => {
    const token = signAccessToken(PAYLOAD, ACCESS_EXPIRATION);
    const decoded = verifyAccessToken(token);

    expect(decoded).toMatchObject(PAYLOAD);
  });

  it('rejects a token signed with a different secret', () => {
    const foreignToken = jsonwebtoken.sign(PAYLOAD, 'a-completely-different-secret', {
      expiresIn: '15m',
    });

    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });

  it('rejects an access token once it has expired', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const token = signAccessToken(PAYLOAD, ACCESS_EXPIRATION);

    // ACCESS_EXPIRATION above is 15m - 20 minutes later is comfortably past it.
    jest.setSystemTime(new Date('2026-01-01T00:20:00.000Z'));

    expect(() => verifyAccessToken(token)).toThrow(jsonwebtoken.TokenExpiredError);

    jest.useRealTimers();
  });
});

describe('signRefreshToken / verifyRefreshToken', () => {
  it('round-trips a payload through sign and verify', () => {
    const token = signRefreshToken(PAYLOAD, REFRESH_EXPIRATION);
    const decoded = verifyRefreshToken(token);

    expect(decoded).toMatchObject(PAYLOAD);
  });

  it('rejects an access token when verified as a refresh token (different secrets)', () => {
    const accessToken = signAccessToken(PAYLOAD, ACCESS_EXPIRATION);

    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it('rejects a refresh token when verified as an access token (different secrets)', () => {
    const refreshToken = signRefreshToken(PAYLOAD, REFRESH_EXPIRATION);

    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});

describe('getTokenExpiry', () => {
  it('returns a Date matching the exp claim of a freshly signed token', () => {
    const before = Date.now();
    const token = signAccessToken(PAYLOAD, ACCESS_EXPIRATION);
    const expiry = getTokenExpiry(token);

    // 15m default expiry - expiry should land comfortably after "now" and well
    // before "now + 16 minutes".
    expect(expiry.getTime()).toBeGreaterThan(before);
    expect(expiry.getTime()).toBeLessThanOrEqual(before + 16 * 60_000);
  });

  it('throws for a token with no exp claim', () => {
    const tokenWithoutExpiry = jsonwebtoken.sign(PAYLOAD, 'some-secret');

    expect(() => getTokenExpiry(tokenWithoutExpiry)).toThrow(
      'Token does not contain an expiration claim.',
    );
  });
});
