import { z } from 'zod';

// The bKash/Nagad transaction reference the user submits when creating a deposit
// (tasks/phase-05.md - Deposit Schema's "Transaction ID", renamed to avoid
// colliding with the wallet ledger's Transaction concept). Free-text rather than
// a fixed regex since the reference format differs per payment provider.
export const paymentReferenceSchema = z
  .string()
  .trim()
  .min(1, 'Payment reference is required.')
  .max(50, 'Payment reference must be at most 50 characters.');
