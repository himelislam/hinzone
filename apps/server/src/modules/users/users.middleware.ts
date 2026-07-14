import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';

import {
  adminUpdateUserSchema,
  updateProfileSchema,
  updateUserStatusSchema,
} from './users.validation';

// Pre-composed validate() + schema middlewares, ready for users.routes.ts /
// admin routes to attach directly. Explicit RequestHandler annotations avoid
// TS2742 (see auth.middleware.ts).
export const validateUpdateProfile: RequestHandler = validate({ body: updateProfileSchema });
export const validateAdminUpdateUser: RequestHandler = validate({ body: adminUpdateUserSchema });
export const validateUpdateUserStatus: RequestHandler = validate({ body: updateUserStatusSchema });
