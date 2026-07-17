import type { Deposit } from 'shared-types';

import type { DepositDocument, DepositFilters, DepositListOptions } from './deposit.types';
import type { DepositListQuery } from './deposit.validation';

// Maps the internal Mongoose document to the exact client-safe shape shared
// with the frontend (id vs _id, ISO date strings vs Date objects, ObjectId refs
// as strings) - same rationale as wallet.dto.ts's toWalletResponse.
export const toDepositResponse = (deposit: DepositDocument): Deposit => ({
  id: deposit.id,
  depositNumber: deposit.depositNumber,
  userId: deposit.userId.toString(),
  walletId: deposit.walletId.toString(),
  amount: deposit.amount,
  currency: deposit.currency,
  paymentMethod: deposit.paymentMethod,
  senderAccountNumber: deposit.senderAccountNumber,
  paymentReference: deposit.paymentReference,
  screenshotUrl: deposit.screenshotUrl,
  status: deposit.status,
  adminNote: deposit.adminNote,
  rejectionReason: deposit.rejectionReason,
  reviewedBy: deposit.reviewedBy?.toString(),
  reviewedAt: deposit.reviewedAt?.toISOString(),
  createdAt: deposit.createdAt.toISOString(),
  updatedAt: deposit.updatedAt.toISOString(),
});

// Shared by deposit.controller.ts's getDeposits and admin-deposit.controller.ts's
// listDeposits - both list the same resource against the identical query shape
// (depositListQuerySchema), so the query -> service-args split is written once
// rather than the same 9-field destructuring duplicated in both controllers.
export const toDepositListArgs = (
  query: DepositListQuery,
): [DepositListOptions, DepositFilters] => [
  { page: query.page, limit: query.limit, sortBy: query.sortBy },
  {
    status: query.status,
    paymentMethod: query.paymentMethod,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    minAmount: query.minAmount,
    maxAmount: query.maxAmount,
    search: query.search,
  },
];
