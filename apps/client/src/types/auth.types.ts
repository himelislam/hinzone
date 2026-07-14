// Request-payload shapes matching apps/server/src/modules/auth/auth.validation.ts's
// zod schemas 1:1 - kept local rather than in shared-types since the backend's own
// equivalents (RegisterRequestBody etc.) are likewise inferred locally, not shared.
export interface RegisterPayload {
  fullName: string;
  username: string;
  email?: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referrerId?: string;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
