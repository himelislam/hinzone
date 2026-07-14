import { Router } from 'express';

import { authenticate } from '@/middlewares/authenticate';
import { authRateLimiter } from '@/middlewares/rateLimiter';

import { authController } from './auth.controller';
import {
  validateChangePassword,
  validateForgotPassword,
  validateLogin,
  validateRefreshToken,
  validateRegister,
  validateResetPassword,
} from './auth.middleware';

export const authRouter: Router = Router();

// Rate limited: credential/token-bearing endpoints susceptible to brute force
// (docs/07-authentication.md #27). GET /me deliberately excluded below - it's a
// routine authenticated read an SPA may call on every navigation, not a
// brute-force target.
authRouter.post('/register', authRateLimiter, validateRegister, authController.register);
authRouter.post('/login', authRateLimiter, validateLogin, authController.login);
authRouter.post('/refresh', authRateLimiter, validateRefreshToken, authController.refresh);
authRouter.post('/logout', authRateLimiter, validateRefreshToken, authController.logout);
authRouter.post(
  '/forgot-password',
  authRateLimiter,
  validateForgotPassword,
  authController.forgotPassword,
);
authRouter.post(
  '/reset-password',
  authRateLimiter,
  validateResetPassword,
  authController.resetPassword,
);
authRouter.put(
  '/change-password',
  authenticate,
  authRateLimiter,
  validateChangePassword,
  authController.changePassword,
);

authRouter.get('/me', authenticate, authController.me);
