import { z } from 'zod';

// Baseline structural policy matching docs/21-validation-rules.md's default password
// policy example. This is a fallback for initial setup; once the Settings module ships,
// AuthService must re-validate passwords against the live Security Settings policy.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character.');
