import { z } from 'zod';
import {
  emailSchema,
  fullNameSchema,
  passwordSchema,
  phoneNumberSchema,
  referralIdSchema,
  usernameSchema,
} from 'shared-validation';

// Mirrors apps/server/src/modules/auth/auth.validation.ts (items 35-39) so the
// client rejects obviously invalid input before it reaches the network. The
// backend re-validates everything regardless (project_rules.md's Validation
// Rules: "Never trust frontend validation").
const optionalEmailField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || emailSchema.safeParse(value).success, {
    message: 'Enter a valid email address.',
  });

const optionalReferralField = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || referralIdSchema.safeParse(value).success, {
    message: 'Enter a valid referral ID.',
  });

export const registerFormSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    email: optionalEmailField,
    phoneNumber: phoneNumberSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
    referrerId: optionalReferralField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  login: z.string().trim().min(1, 'Username, phone number, or email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
