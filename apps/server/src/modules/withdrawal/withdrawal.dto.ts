import type { Withdrawal } from 'shared-types';

import type {
  WithdrawalDocument,
  WithdrawalFilters,
  WithdrawalListOptions,
} from './withdrawal.types';
import type { WithdrawalListQuery } from './withdrawal.validation';

// Maps the internal Mongoose document to the exact client-safe shape shared
// with the frontend (id vs _id, ISO date strings vs Date objects, ObjectId
// refs as strings) - same rationale as deposit.dto.ts's toDepositResponse.
// `waitingPeriodSatisfied` is an optional second argument, not a field read
// off `withdrawal` itself - only the admin GET-by-id controller computes and
// passes it (withdrawalService.getWaitingPeriodStatusForAdmin); every other
// caller omits it and the response field is simply absent, unchanged from
// before this was added.
export const toWithdrawalResponse = (
  withdrawal: WithdrawalDocument,
  waitingPeriodSatisfied?: boolean,
): Withdrawal => ({
  id: withdrawal.id,
  withdrawalNumber: withdrawal.withdrawalNumber,
  userId: withdrawal.userId.toString(),
  walletId: withdrawal.walletId.toString(),
  amount: withdrawal.amount,
  withdrawalFee: withdrawal.withdrawalFee,
  netAmount: withdrawal.netAmount,
  currency: withdrawal.currency,
  paymentMethod: withdrawal.paymentMethod,
  receiverAccountNumber: withdrawal.receiverAccountNumber,
  accountHolderName: withdrawal.accountHolderName,
  status: withdrawal.status,
  adminNote: withdrawal.adminNote,
  rejectionReason: withdrawal.rejectionReason,
  reviewedBy: withdrawal.reviewedBy?.toString(),
  reviewedAt: withdrawal.reviewedAt?.toISOString(),
  processedAt: withdrawal.processedAt?.toISOString(),
  completedAt: withdrawal.completedAt?.toISOString(),
  createdAt: withdrawal.createdAt.toISOString(),
  updatedAt: withdrawal.updatedAt.toISOString(),
  waitingPeriodSatisfied,
});

// Shared by withdrawal.controller.ts's getWithdrawals and
// admin-withdrawal.controller.ts's listWithdrawals - both list the same
// resource against the identical query shape (withdrawalListQuerySchema), so
// the query -> service-args split is written once rather than duplicated in
// both controllers.
export const toWithdrawalListArgs = (
  query: WithdrawalListQuery,
): [WithdrawalListOptions, WithdrawalFilters] => [
  { page: query.page, limit: query.limit, sortBy: query.sortBy },
  {
    status: query.status,
    paymentMethod: query.paymentMethod,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    minAmount: query.minAmount,
    maxAmount: query.maxAmount,
    search: query.search,
    userId: query.userId,
  },
];
