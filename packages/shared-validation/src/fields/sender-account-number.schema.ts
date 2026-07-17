import { z } from 'zod';

// The account/number the user paid from (bKash, Nagad, or a future payment
// method's own identifier) - deliberately generic rather than Bangladesh-mobile-
// specific (phoneNumberSchema), since paymentMethod is Settings-driven and not
// limited to mobile wallets (docs/09-deposit-module.md lists a future Bank
// Transfer method whose account number wouldn't be a phone number). Matches how
// settings.validation.ts's companyBkashNumber/companyNagadNumber are validated -
// as plain strings, not through phoneNumberSchema.
export const senderAccountNumberSchema = z
  .string()
  .trim()
  .min(1, 'Sender account number is required.')
  .max(50, 'Sender account number must be at most 50 characters.');
