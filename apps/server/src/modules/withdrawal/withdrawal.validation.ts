import { z } from 'zod';
import { WithdrawalStatus } from 'shared-types';
import { amountSchema, fullNameSchema, receiverAccountNumberSchema } from 'shared-validation';

import { WITHDRAWAL_SORT_OPTIONS } from './withdrawal.types';

// POST /api/v1/withdrawals body (tasks/phase-06.md - "Create Withdrawal
// Request"). Unlike deposit.validation.ts's createDepositSchema, this is a
// plain JSON body (no file upload alongside it), so no z.preprocess string-
// coercion workaround is needed - deposit's multipart-vs-z.number() bug has
// no equivalent here. `accountHolderName` reuses fullNameSchema unchanged -
// it's already a generic person-name validator, no withdrawal-specific
// meaning.
export const createWithdrawalSchema = z.object({
  amount: amountSchema,
  paymentMethod: z.string().trim().min(1, 'Payment method is required.'),
  receiverAccountNumber: receiverAccountNumberSchema,
  accountHolderName: fullNameSchema,
});

// GET /api/v1/withdrawals and GET /api/v1/admin/withdrawals query params
// (tasks/phase-06.md's Search & Filtering + Pagination sections) - mirrors
// deposit.validation.ts's depositListQuerySchema exactly.
export const withdrawalListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(WITHDRAWAL_SORT_OPTIONS).default('latest'),
  status: z.nativeEnum(WithdrawalStatus).optional(),
  paymentMethod: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  // Free-text match against withdrawalNumber (withdrawal.repository.ts's
  // buildFilterQuery).
  search: z.string().trim().min(1).optional(),
  // Admin-only "User" filter (tasks/phase-06.md's Search & Filtering) - an
  // exact userId match, not a name search. Shared by both GET /withdrawals
  // and GET /admin/withdrawals schemas for simplicity (same reuse as every
  // other field here), but withdrawal.repository.ts's findByUserId never
  // reads it, so a regular user passing this param has no effect on their
  // own (already-scoped) list. Same 24-hex-char format mongoIdParamSchema
  // validates for route params, applied here for a query param instead.
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format.')
    .optional(),
});

// PATCH /api/v1/admin/withdrawals/:id/reject body (tasks/phase-06.md's
// Withdrawal Rejection Workflow: "Provide Reason").
export const rejectWithdrawalSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'A rejection reason is required.'),
});

export type CreateWithdrawalRequestBody = z.infer<typeof createWithdrawalSchema>;
export type WithdrawalListQuery = z.infer<typeof withdrawalListQuerySchema>;
export type RejectWithdrawalRequestBody = z.infer<typeof rejectWithdrawalSchema>;
