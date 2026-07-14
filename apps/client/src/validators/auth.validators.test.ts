import { describe, expect, it } from 'vitest';

import {
  changePasswordFormSchema,
  forgotPasswordFormSchema,
  loginFormSchema,
  registerFormSchema,
  resetPasswordFormSchema,
} from './auth.validators';

const VALID_PASSWORD = 'TestPass123!';

describe('loginFormSchema', () => {
  it('accepts a username, phone number, or email in the login field', () => {
    expect(loginFormSchema.safeParse({ login: 'johndoe', password: 'anything' }).success).toBe(
      true,
    );
  });

  it('rejects an empty login field', () => {
    expect(loginFormSchema.safeParse({ login: '', password: 'anything' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(loginFormSchema.safeParse({ login: 'johndoe', password: '' }).success).toBe(false);
  });
});

describe('registerFormSchema', () => {
  const validPayload = {
    fullName: 'Jane Doe',
    username: 'janedoe',
    phoneNumber: '01712345678',
    password: VALID_PASSWORD,
    confirmPassword: VALID_PASSWORD,
  };

  it('accepts a fully valid payload with no optional fields', () => {
    expect(registerFormSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts a valid optional email', () => {
    const result = registerFormSchema.safeParse({ ...validPayload, email: 'jane@example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts an empty-string email (treated as not provided)', () => {
    expect(registerFormSchema.safeParse({ ...validPayload, email: '' }).success).toBe(true);
  });

  it('rejects a malformed email when one is provided', () => {
    expect(registerFormSchema.safeParse({ ...validPayload, email: 'not-an-email' }).success).toBe(
      false,
    );
  });

  it('rejects a malformed referrerId when one is provided', () => {
    expect(
      registerFormSchema.safeParse({ ...validPayload, referrerId: 'not-a-referral-id' }).success,
    ).toBe(false);
  });

  it('accepts a well-formed referrerId', () => {
    expect(registerFormSchema.safeParse({ ...validPayload, referrerId: 'REF100001' }).success).toBe(
      true,
    );
  });

  it('rejects a username shorter than 4 characters', () => {
    expect(registerFormSchema.safeParse({ ...validPayload, username: 'ab' }).success).toBe(false);
  });

  it('rejects a phone number in the wrong format', () => {
    expect(registerFormSchema.safeParse({ ...validPayload, phoneNumber: '123' }).success).toBe(
      false,
    );
  });

  it.each([
    ['too short', 'Sh0rt!'],
    ['missing an uppercase letter', 'testpass123!'],
    ['missing a lowercase letter', 'TESTPASS123!'],
    ['missing a number', 'TestPassword!'],
    ['missing a special character', 'TestPass123'],
  ])('rejects a password %s', (_description, password) => {
    expect(
      registerFormSchema.safeParse({ ...validPayload, password, confirmPassword: password })
        .success,
    ).toBe(false);
  });

  it('rejects mismatched password/confirmPassword', () => {
    const result = registerFormSchema.safeParse({
      ...validPayload,
      confirmPassword: 'SomethingElse123!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
    }
  });
});

describe('forgotPasswordFormSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordFormSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(forgotPasswordFormSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a missing email', () => {
    expect(forgotPasswordFormSchema.safeParse({}).success).toBe(false);
  });
});

describe('resetPasswordFormSchema', () => {
  it('accepts matching, sufficiently strong passwords', () => {
    const result = resetPasswordFormSchema.safeParse({
      newPassword: VALID_PASSWORD,
      confirmNewPassword: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    expect(
      resetPasswordFormSchema.safeParse({
        newPassword: VALID_PASSWORD,
        confirmNewPassword: 'Different123!',
      }).success,
    ).toBe(false);
  });

  it('rejects a weak new password', () => {
    expect(
      resetPasswordFormSchema.safeParse({ newPassword: 'weak', confirmNewPassword: 'weak' })
        .success,
    ).toBe(false);
  });
});

describe('changePasswordFormSchema', () => {
  it('accepts a valid payload', () => {
    const result = changePasswordFormSchema.safeParse({
      currentPassword: 'CurrentPass1!',
      newPassword: VALID_PASSWORD,
      confirmNewPassword: VALID_PASSWORD,
    });

    expect(result.success).toBe(true);
  });

  it('rejects an empty currentPassword', () => {
    expect(
      changePasswordFormSchema.safeParse({
        currentPassword: '',
        newPassword: VALID_PASSWORD,
        confirmNewPassword: VALID_PASSWORD,
      }).success,
    ).toBe(false);
  });

  it('rejects mismatched new passwords', () => {
    expect(
      changePasswordFormSchema.safeParse({
        currentPassword: 'CurrentPass1!',
        newPassword: VALID_PASSWORD,
        confirmNewPassword: 'Different123!',
      }).success,
    ).toBe(false);
  });
});
