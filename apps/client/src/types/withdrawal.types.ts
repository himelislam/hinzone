import type { WithdrawalStatus } from 'shared-types';

// Mirrors apps/server/src/modules/withdrawal/withdrawal.types.ts's
// WITHDRAWAL_SORT_OPTIONS - duplicated here rather than shared, same
// reasoning as deposit.types.ts's DepositSortBy: a single 4-literal union
// with no other coupling to that server module.
export type WithdrawalSortBy = 'latest' | 'oldest' | 'highestAmount' | 'lowestAmount';

// Mirrors apps/server/src/modules/withdrawal/withdrawal.validation.ts's
// withdrawalListQuerySchema (GET /withdrawals and GET /admin/withdrawals) -
// the server reuses one schema for both, so this one type covers both
// withdrawal.service.ts's getWithdrawals and adminListWithdrawals, same
// reasoning as deposit.types.ts's DepositListParams.
export interface WithdrawalListParams {
  page?: number;
  limit?: number;
  sortBy?: WithdrawalSortBy;
  status?: WithdrawalStatus;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  // Free-text match against withdrawalNumber
  // (apps/server/src/modules/withdrawal/withdrawal.repository.ts).
  search?: string;
  // Admin-only exact-match "User" filter (tasks/phase-06.md's Search &
  // Filtering) - has no effect when sent by the user-facing GET /withdrawals
  // endpoint, which never reads it (withdrawal.repository.ts's findByUserId).
  userId?: string;
}

// Mirrors apps/server/src/modules/withdrawal/withdrawal.validation.ts's
// createWithdrawalSchema (POST /withdrawals). Plain object, not FormData -
// unlike deposit.types.ts's CreateDepositPayload, this endpoint carries no
// file alongside it.
export interface CreateWithdrawalPayload {
  amount: number;
  paymentMethod: string;
  receiverAccountNumber: string;
  accountHolderName: string;
}

// Mirrors apps/server/src/modules/withdrawal/withdrawal.validation.ts's
// rejectWithdrawalSchema (PATCH /admin/withdrawals/:id/reject).
export interface RejectWithdrawalPayload {
  rejectionReason: string;
}
