import type { HydratedDocument, Model, Types } from 'mongoose';
import type { TransactionCategory, TransactionStatus, TransactionType } from 'shared-types';

// tasks/phase-04.md - Transaction Schema. Immutable after creation except for
// `status` transitioning between TransactionStatus values (database_rules.md #16) -
// there is deliberately no updatedAt, matching audit-log.model.ts's precedent for
// immutable collections.
export interface ITransaction {
  transactionNumber: string;
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  // The admin who performed the action for ADMIN_ADJUSTMENT transactions; unset
  // for system/user-triggered transactions. `| null` because the schema default
  // (transaction.model.ts) is `null`, not an absent field.
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
}

export type TransactionDocument = HydratedDocument<ITransaction>;
export type TransactionModel = Model<ITransaction>;

export interface CreateTransactionInput {
  transactionNumber: string;
  walletId: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status?: TransactionStatus;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdBy?: Types.ObjectId;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  // Free-text match against transactionNumber/description (tasks/phase-04.md's
  // Transaction History > Features: Search).
  search?: string;
}

// tasks/phase-04.md - Transaction Filtering > Sorting. A runtime constant (not
// just a type) so wallet.validation.ts's z.enum() can derive its accepted values
// from the same source transaction.repository.ts's sort-query map is keyed by,
// rather than duplicating the four literals in two places.
export const TRANSACTION_SORT_OPTIONS = [
  'latest',
  'oldest',
  'highestAmount',
  'lowestAmount',
] as const;
export type TransactionSortBy = (typeof TRANSACTION_SORT_OPTIONS)[number];

export interface TransactionListOptions {
  page: number;
  limit: number;
  sortBy?: TransactionSortBy;
}

export interface PaginatedTransactions {
  items: TransactionDocument[];
  total: number;
}
