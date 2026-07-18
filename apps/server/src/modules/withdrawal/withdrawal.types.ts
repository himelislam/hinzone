import type { HydratedDocument, Model, Types } from 'mongoose';
import type { WithdrawalStatus } from 'shared-types';

// tasks/phase-06.md - Withdrawal Schema. Immutable once COMPLETED/REJECTED/
// CANCELLED except that transition's own reviewer/processing/completion
// fields - the submitted amount, fee, payment method, and receiver details
// never change after creation (database_rules.md #16's "financial history
// records must be immutable" applies here the same way it does to
// deposit.types.ts's IDeposit).
export interface IWithdrawal {
  withdrawalNumber: string;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  amount: number;
  withdrawalFee: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  receiverAccountNumber: string;
  accountHolderName: string;
  status: WithdrawalStatus;
  adminNote?: string;
  rejectionReason?: string;
  // Set only once the withdrawal leaves PENDING (approve/reject); absent
  // while still pending. Named generically - not "approvedBy" - since this
  // also records who rejected a withdrawal, matching deposit.types.ts's
  // reviewedBy `| null` default for "not yet applicable" reviewer fields.
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  // Set only when moved to PROCESSING (optional intermediate step).
  processedAt?: Date | null;
  // Set only when moved to COMPLETED - the moment WalletService.debit()
  // actually runs (tasks/breakdown/phase-06-tasks.md's "decision 1": the
  // wallet is debited at Completion, not Approval).
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WithdrawalDocument = HydratedDocument<IWithdrawal>;
export type WithdrawalModel = Model<IWithdrawal>;

export interface CreateWithdrawalInput {
  withdrawalNumber: string;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  amount: number;
  withdrawalFee: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  receiverAccountNumber: string;
  accountHolderName: string;
}

export interface WithdrawalFilters {
  status?: WithdrawalStatus;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  // Free-text match against withdrawalNumber only (tasks/phase-06.md's
  // Search & Filtering). Matching a submitting user by *name* is a
  // service-layer concern - it requires resolving a username to a userId in
  // the Users collection first, outside this repository's single-collection
  // scope (same boundary deposit.types.ts's DepositFilters draws). This is a
  // narrower "search" field, not the exact-userId "User" filter below.
  search?: string;
  // Admin-only equality filter on the submitting user's id (tasks/phase-06.md's
  // Search & Filtering "User" field) - consumed only by
  // withdrawal.repository.ts's findAllAdmin. findByUserId (the user-facing
  // list) never reads this field, so it can never be used to escape a
  // caller's own ownership scope even if present in a user's request.
  userId?: string;
}

// tasks/phase-06.md - Search & Filtering > Sorting. A runtime constant (not
// just a type) so withdrawal.validation.ts's z.enum() can derive its
// accepted values from the same source this file's SORT_BY_TO_QUERY map is
// keyed by, exactly like deposit.types.ts's DEPOSIT_SORT_OPTIONS.
export const WITHDRAWAL_SORT_OPTIONS = [
  'latest',
  'oldest',
  'highestAmount',
  'lowestAmount',
] as const;
export type WithdrawalSortBy = (typeof WITHDRAWAL_SORT_OPTIONS)[number];

export interface WithdrawalListOptions {
  page: number;
  limit: number;
  sortBy?: WithdrawalSortBy;
}

export interface PaginatedWithdrawals {
  items: WithdrawalDocument[];
  total: number;
}

export interface UpdateWithdrawalStatusInput {
  status: WithdrawalStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  adminNote?: string;
  rejectionReason?: string;
}
