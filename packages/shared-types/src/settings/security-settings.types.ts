// Mirrors docs/18-security.md #5's example shape exactly.
export interface PasswordPolicy {
  minimumLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialCharacters: boolean;
}

// The live source of truth consumed by apps/server/src/modules/auth/token.service.ts
// (JWT expirations), auth.service.ts (login-attempt lockout), password.service.ts
// (reset-token expiration), and password-policy.helpers.ts (password policy) -
// config/jwt.ts and config/security.ts now hold only secrets and non-Settings
// values (rate limiting, bcrypt cost), never a business-rule fallback.
export interface SecuritySettings {
  // Duration strings such as "15m" / "7d", matching jsonwebtoken's expiresIn format
  // (apps/server/src/config/jwt.ts).
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  passwordPolicy: PasswordPolicy;
  maximumLoginAttempts: number;
  accountLockDurationMinutes: number;
  passwordResetTokenExpirationMinutes: number;
  sessionTimeoutMinutes: number;
  twoFactorEnabled: boolean;
}
