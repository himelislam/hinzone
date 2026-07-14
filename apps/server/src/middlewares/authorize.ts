import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { UserRole } from 'shared-types';

import { AuthorizationError } from '@/shared/errors';

// docs/07-authentication.md #18 - e.g. authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN).
// Must run after authenticate() so req.user is already populated.
export const authorize = (...roles: UserRole[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AuthorizationError('You are not authorized to perform this action.'));
      return;
    }

    next();
  };
};
