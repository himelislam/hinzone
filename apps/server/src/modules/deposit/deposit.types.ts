import type { HydratedDocument, Model, Types } from 'mongoose';
import type { DepositStatus } from 'shared-types';

// tasks/phase-05.md - Deposit Schema. Immutable once APPROVED/REJECTED/CANCELLED
// except that transition's own reviewer fields - the submitted amount, payment
// method, and screenshot never change after creation (database_rules.md #16's
// "financial history records must be immutable" applies here the same way it
// does to transaction.types.ts's ITransaction).
export interface IDeposit {
  depositNumber: string;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  senderAccountNumber: string;
  paymentReference: string;
  screenshotUrl: string;
  status: DepositStatus;
  adminNote?: string;
  rejectionReason?: string;
  // Set only once the deposit leaves PENDING (approve/reject); absent while
  // still pending, matching transaction.types.ts's createdBy `| null` default
  // for "not yet applicable" reviewer/actor fields.
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DepositDocument = HydratedDocument<IDeposit>;
export type DepositModel = Model<IDeposit>;

export interface CreateDepositInput {
  depositNumber: string;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  senderAccountNumber: string;
  paymentReference: string;
  screenshotUrl: string;
}

export interface DepositFilters {
  status?: DepositStatus;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  // Free-text match against depositNumber only (tasks/phase-05.md's Search &
  // Filtering). Matching by submitting user is a service-layer concern - it
  // requires resolving a username/name to a userId in the Users collection
  // first, which is outside this repository's single-collection scope (same
  // boundary transaction.repository.ts's buildFilterQuery draws around
  // transactionNumber/description).
  search?: string;
}

// tasks/phase-05.md - Search & Filtering > Sorting. A runtime constant (not just
// a type) so a future deposit.validation.ts's z.enum() can derive its accepted
// values from the same source this file's SORT_BY_TO_QUERY map is keyed by,
// exactly like transaction.types.ts's TRANSACTION_SORT_OPTIONS.
export const DEPOSIT_SORT_OPTIONS = ['latest', 'oldest', 'highestAmount', 'lowestAmount'] as const;
export type DepositSortBy = (typeof DEPOSIT_SORT_OPTIONS)[number];

export interface DepositListOptions {
  page: number;
  limit: number;
  sortBy?: DepositSortBy;
}

export interface PaginatedDeposits {
  items: DepositDocument[];
  total: number;
}

export interface UpdateDepositStatusInput {
  status: DepositStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  adminNote?: string;
  rejectionReason?: string;
}
