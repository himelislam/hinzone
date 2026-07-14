import { describe, expect, it } from 'vitest';

import { updateProfileFormSchema } from './users.validators';

describe('updateProfileFormSchema', () => {
  it('accepts an empty object (no fields being changed)', () => {
    expect(updateProfileFormSchema.safeParse({}).success).toBe(true);
  });

  it('accepts a valid fullName and phoneNumber', () => {
    const result = updateProfileFormSchema.safeParse({
      fullName: 'Jane Doe',
      phoneNumber: '01712345678',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a fullName shorter than 2 characters when provided', () => {
    expect(updateProfileFormSchema.safeParse({ fullName: 'J' }).success).toBe(false);
  });

  it('rejects a malformed phone number when provided', () => {
    expect(updateProfileFormSchema.safeParse({ phoneNumber: '12345' }).success).toBe(false);
  });

  it('does not accept a profileImage field (set only via the dedicated upload endpoint)', () => {
    const result = updateProfileFormSchema.safeParse({
      fullName: 'Jane Doe',
      profileImage: 'https://evil.example.com/x.png',
    });

    // Unknown keys are stripped by default zod behavior, not rejected outright -
    // the important part is that profileImage never ends up in the parsed data.
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('profileImage');
    }
  });
});
