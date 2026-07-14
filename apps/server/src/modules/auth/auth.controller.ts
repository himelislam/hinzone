import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { successResponse } from '@/shared/response';

import { toUserResponse } from '../users/users.dto';

import { toAuthResponse } from './auth.dto';
import { authService } from './auth.service';
import type { AuthRequestContext } from './auth.types';
import type {
  ChangePasswordRequestBody,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  RefreshTokenRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
} from './auth.validation';

// device/browser/operatingSystem are left for a future User-Agent parsing step -
// only the raw, always-available values are captured here.
const buildRequestContext = (req: Request): AuthRequestContext => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

const register = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as RegisterRequestBody;
  const { user, tokens } = await authService.register(body, buildRequestContext(req));

  successResponse(res, toAuthResponse(user, tokens), 'Registration successful.', 201);
};

const login = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as LoginRequestBody;
  const { user, tokens } = await authService.login(body, buildRequestContext(req));

  successResponse(res, toAuthResponse(user, tokens), 'Login successful.');
};

const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshTokenRequestBody;
  const tokens = await authService.refresh(refreshToken, buildRequestContext(req));

  successResponse(res, tokens, 'Token refreshed successfully.');
};

const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as RefreshTokenRequestBody;
  await authService.logout(refreshToken, buildRequestContext(req));

  successResponse(res, null, 'Logout successful.');
};

// Always responds with the same generic message regardless of whether the email
// matched an account - authService.forgotPassword's return value is intentionally
// not surfaced here, to preserve the anti-enumeration behavior it was built for.
const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as ForgotPasswordRequestBody;
  await authService.forgotPassword(email, buildRequestContext(req));

  successResponse(
    res,
    null,
    'If an account exists with this email, a password reset link has been sent.',
  );
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as ResetPasswordRequestBody;
  await authService.resetPassword(token, newPassword, buildRequestContext(req));

  successResponse(res, null, 'Password has been reset successfully.');
};

const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { currentPassword, newPassword } = req.body as ChangePasswordRequestBody;
  await authService.changePassword(userId, currentPassword, newPassword, buildRequestContext(req));

  successResponse(res, null, 'Password changed successfully.');
};

const me = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const user = await authService.getCurrentUser(userId);

  successResponse(res, toUserResponse(user), 'Current user retrieved successfully.');
};

export const authController = {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
