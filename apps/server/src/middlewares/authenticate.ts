import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '@/config/jwt';
import { AuthenticationError } from '@/shared/errors';

const BEARER_PREFIX = 'Bearer ';

const extractBearerToken = (req: Request): string | null => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }

  return authorizationHeader.slice(BEARER_PREFIX.length);
};

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearerToken(req);

  if (!token) {
    next(new AuthenticationError('Authentication token is missing.'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AuthenticationError('Authentication token is invalid or has expired.'));
  }
};

// For routes that behave differently for signed-in vs. anonymous users but don't
// require authentication (docs/07-authentication.md #19's public routes). A
// missing, invalid, or expired token is not an error here - the request just
// proceeds without req.user set.
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearerToken(req);

  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Ignore - proceed as anonymous.
    }
  }

  next();
};
