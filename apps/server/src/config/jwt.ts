import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from 'shared-types';

import { env } from './environment';

export const jwtConfig = Object.freeze({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiration: env.JWT_ACCESS_EXPIRATION,
  refreshExpiration: env.JWT_REFRESH_EXPIRATION,
});

// Payload shape fixed by docs/07-authentication.md #12 - never add password,
// wallet balance, or other financial/sensitive data to the JWT payload.
export interface TokenPayload {
  readonly userId: string;
  readonly username: string;
  readonly role: UserRole;
}

export const signAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, jwtConfig.accessSecret, {
    expiresIn: jwtConfig.accessExpiration,
    algorithm: 'HS256',
  } as jwt.SignOptions);

// jwt.sign is deterministic for a given payload+secret+iat - two refresh tokens
// issued for the same user within the same second (e.g. login immediately
// followed by refresh) would otherwise be byte-identical, and
// refresh-token.model.ts's unique index on the resulting hash would reject the
// second insert outright. The `jti` (a standard registered JWT claim, not
// application data - docs/07-authentication.md #12's payload restriction is
// about business/sensitive fields) guarantees uniqueness regardless of timing.
export const signRefreshToken = (payload: TokenPayload): string =>
  jwt.sign({ ...payload, jti: randomUUID() }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiration,
    algorithm: 'HS256',
  } as jwt.SignOptions);

export const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, jwtConfig.accessSecret, { algorithms: ['HS256'] }) as TokenPayload;

export const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, jwtConfig.refreshSecret, { algorithms: ['HS256'] }) as TokenPayload;

// Reads the `exp` claim from an already-signed token instead of re-parsing the
// "15m" / "7d" duration strings, so the resulting Date always matches exactly what
// was actually signed.
export const getTokenExpiry = (token: string): Date => {
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;

  if (!decoded?.exp) {
    throw new Error('Token does not contain an expiration claim.');
  }

  return new Date(decoded.exp * 1000);
};
