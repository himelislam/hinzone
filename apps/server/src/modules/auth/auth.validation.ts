import { z } from 'zod';
import {
  emailSchema,
  fullNameSchema,
  passwordSchema,
  phoneNumberSchema,
  referralIdSchema,
  usernameSchema,
} from 'shared-validation';

// Matches auth.types.ts's RegisterInput plus a UX-only confirmPassword field that
// never reaches the service layer - the controller strips it after validation.
export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    email: emailSchema.optional(),
    phoneNumber: phoneNumberSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    referrerId: referralIdSchema.optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

// `login` accepts a username, phone number, or email (docs/07-authentication.md #10),
// so it is intentionally not validated against any single field's format here - the
// service layer resolves it against all three.
export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Username, phone number, or email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

// Shared by POST /auth/refresh and POST /auth/logout - both operate purely on a
// presented refresh token.
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required.'),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

// userId comes from the authenticated request, not the body - only the passwords
// are validated here.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

// Inferred request-body types for controllers - avoids each controller needing to
// import zod directly just to derive the shape validate() already guaranteed.
export type RegisterRequestBody = z.infer<typeof registerSchema>;
export type LoginRequestBody = z.infer<typeof loginSchema>;
export type RefreshTokenRequestBody = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordRequestBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestBody = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequestBody = z.infer<typeof changePasswordSchema>;
