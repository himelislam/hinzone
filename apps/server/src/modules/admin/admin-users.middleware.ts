import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import {
  adminUpdateUserSchema,
  listUsersQuerySchema,
  updateUserStatusSchema,
} from '../users/users.validation';

// Pre-composed validate() + schema middlewares, matching the auth.middleware.ts /
// users.middleware.ts convention. Explicit RequestHandler annotations avoid
// TS2742 (see auth.middleware.ts for why).
export const validateListUsersQuery: RequestHandler = validate({ query: listUsersQuerySchema });
export const validateUserIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
export const validateAdminUpdateUser: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: adminUpdateUserSchema,
});
export const validateUpdateUserStatus: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: updateUserStatusSchema,
});
