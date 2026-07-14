import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';

import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.validation';

// Pre-composed validate() + schema middlewares (docs/07-authentication.md #5 lists
// auth.middleware.ts as its own file), ready for auth.routes.ts to attach directly.
// Explicit RequestHandler annotations avoid TS2742 (pnpm's nested node_modules
// layout makes the inferred type unnameable in the emitted .d.ts without one).
export const validateRegister: RequestHandler = validate({ body: registerSchema });
export const validateLogin: RequestHandler = validate({ body: loginSchema });
export const validateRefreshToken: RequestHandler = validate({ body: refreshTokenSchema });
export const validateForgotPassword: RequestHandler = validate({ body: forgotPasswordSchema });
export const validateResetPassword: RequestHandler = validate({ body: resetPasswordSchema });
export const validateChangePassword: RequestHandler = validate({ body: changePasswordSchema });
