import type { PasswordPolicy } from 'shared-types';

import { settingsService } from '@/modules/settings/settings.service';
import { ValidationError } from '@/shared/errors';

const SPECIAL_CHARACTER_REGEX = /[^A-Za-z0-9]/;

const collectPolicyViolations = (password: string, policy: PasswordPolicy): string[] => {
  const violations: string[] = [];

  if (password.length < policy.minimumLength) {
    violations.push(`Password must be at least ${policy.minimumLength} characters.`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    violations.push('Password must contain at least one uppercase letter.');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    violations.push('Password must contain at least one lowercase letter.');
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    violations.push('Password must contain at least one number.');
  }

  if (policy.requireSpecialCharacters && !SPECIAL_CHARACTER_REGEX.test(password)) {
    violations.push('Password must contain at least one special character.');
  }

  return violations;
};

// shared-validation's static passwordSchema (auth.validation.ts's registerSchema/
// resetPasswordSchema/changePasswordSchema) only enforces a fixed baseline at the
// HTTP boundary. This re-checks the password against the *live*, admin-configured
// policy (settingsService.getSecurity().passwordPolicy) before it's ever persisted,
// per docs/20-settings-system.md #19/#31 ("no security policy may be hardcoded").
export const assertPasswordMeetsPolicy = async (password: string): Promise<void> => {
  const { passwordPolicy } = await settingsService.getSecurity();
  const violations = collectPolicyViolations(password, passwordPolicy);

  if (violations.length > 0) {
    throw new ValidationError(
      'Password does not meet the security policy.',
      violations.map((message) => ({ path: 'password', message })),
    );
  }
};
