import { z } from 'zod';
import { DepositStatus } from 'shared-types';
import {
  packageAmountSchema,
  paymentReferenceSchema,
  senderAccountNumberSchema,
} from 'shared-validation';

import { DEPOSIT_SORT_OPTIONS } from './deposit.types';

// POST /api/v1/deposits body (tasks/phase-05.md - Create Deposit Request). The
// screenshot file itself is validated by the uploadDepositScreenshot multer
// middleware (deposit.middleware.ts), not here - same split as
// users.validation.ts's avatar upload. `senderAccountNumber` is deliberately
// payment-method-agnostic (not phoneNumberSchema) since `paymentMethod` is
// Settings-driven and not limited to Bangladeshi mobile wallets.
export const createDepositSchema = z.object({
  // This endpoint is multipart/form-data (it carries the screenshot file
  // alongside these fields), so multer parses every non-file field - including
  // this one - as a string, never a native number. Preprocessing the raw string
  // into a number before handing it to packageAmountSchema reuses that schema's
  // constraints/messages unchanged rather than re-declaring them; a JSON caller
  // sending an actual number still passes through untouched.
  packageAmount: z.preprocess(
    (value) => (typeof value === 'string' ? Number(value) : value),
    packageAmountSchema,
  ),
  paymentMethod: z.string().trim().min(1, 'Payment method is required.'),
  senderAccountNumber: senderAccountNumberSchema,
  paymentReference: paymentReferenceSchema,
});

// GET /api/v1/deposits and GET /api/v1/admin/deposits query params
// (tasks/phase-05.md's Search & Filtering + Pagination sections).
export const depositListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(DEPOSIT_SORT_OPTIONS).default('latest'),
  status: z.nativeEnum(DepositStatus).optional(),
  paymentMethod: z.string().trim().min(1).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  // Free-text match against depositNumber (deposit.repository.ts's buildFilterQuery).
  search: z.string().trim().min(1).optional(),
});

// PATCH /api/v1/admin/deposits/:id/reject body (tasks/phase-05.md - Deposit
// Rejection Workflow: "Provide Reason").
export const rejectDepositSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'A rejection reason is required.'),
});

export type CreateDepositRequestBody = z.infer<typeof createDepositSchema>;
export type DepositListQuery = z.infer<typeof depositListQuerySchema>;
export type RejectDepositRequestBody = z.infer<typeof rejectDepositSchema>;
