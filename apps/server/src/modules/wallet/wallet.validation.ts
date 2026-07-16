import { z } from 'zod';
import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from 'shared-types';
import { amountSchema } from 'shared-validation';

import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import { TRANSACTION_SORT_OPTIONS } from './transaction.types';

// POST /api/v1/admin/wallets/:id/adjust body (Task D) - tasks/phase-04.md's
// "Every adjustment requires: Reason, Admin authentication, Audit log."
export const walletAdjustmentSchema = z.object({
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  amount: amountSchema,
  reason: z.string().trim().min(1, 'A reason is required for wallet adjustments.'),
});

// GET /api/v1/wallet/transactions and the admin equivalent (Task D) query params -
// tasks/phase-04.md's Transaction Filtering + Pagination sections.
export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.nativeEnum(TransactionType).optional(),
  category: z.nativeEnum(TransactionCategory).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sortBy: z.enum(TRANSACTION_SORT_OPTIONS).default('latest'),
  // Free-text match against transactionNumber/description
  // (transaction.repository.ts's buildFilterQuery).
  search: z.string().trim().min(1).optional(),
});

// GET /api/v1/admin/wallets/user/:userId (Task D) - mongoIdParamSchema (shared/
// validators) validates a param named `id`; this route's param is `userId`
// instead, so its field validator is reused under the right key rather than
// duplicating the regex.
export const walletUserIdParamSchema = z.object({
  userId: mongoIdParamSchema.shape.id,
});

// GET /api/v1/admin/wallets query params (Task D) - tasks/phase-04.md's Admin
// Wallet APIs section. `sort` is whitelisted rather than a bare string, same
// reasoning as users.validation.ts's listUsersQuerySchema: it is plugged
// straight into a Mongo .sort({[sort]: order}) call in wallet.repository.ts.
const ADMIN_WALLET_SORTABLE_FIELDS = [
  'createdAt',
  'availableBalance',
  'totalDeposited',
  'totalWithdrawn',
] as const;

export const adminWalletListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(ADMIN_WALLET_SORTABLE_FIELDS).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  status: z.nativeEnum(WalletStatus).optional(),
});

export type WalletAdjustmentRequestBody = z.infer<typeof walletAdjustmentSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type WalletUserIdParams = z.infer<typeof walletUserIdParamSchema>;
export type AdminWalletListQuery = z.infer<typeof adminWalletListQuerySchema>;
