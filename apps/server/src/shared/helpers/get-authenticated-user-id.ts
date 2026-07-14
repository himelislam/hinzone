import type { Request } from 'express';

import { AuthenticationError } from '@/shared/errors';

// req.user is only set by the authenticate() middleware, so this is guaranteed on
// any route that applies it first - this guard exists for the (developer-error)
// case where a route forgets to, rather than for anything a client controls.
export const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user) {
    throw new AuthenticationError('Authentication is required.');
  }

  return req.user.userId;
};
