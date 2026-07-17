import type { DepositStatus } from 'shared-types';

// Mirrors apps/server/src/modules/deposit/deposit.types.ts's DEPOSIT_SORT_OPTIONS -
// duplicated here rather than shared, same reasoning as wallet.types.ts's
// TransactionSortBy: a single 4-literal union with no other coupling to that
// server module.
export type DepositSortBy = 'latest' | 'oldest' | 'highestAmount' | 'lowestAmount';

// Mirrors apps/server/src/modules/deposit/deposit.validation.ts's
// depositListQuerySchema (GET /deposits and GET /admin/deposits) - the server
// reuses one schema for both, so this one type covers both
// deposit.service.ts's getDeposits and adminListDeposits, unlike
// wallet.types.ts's separate TransactionListParams/AdminWalletListParams (those
// cover genuinely different resources; this doesn't).
export interface DepositListParams {
  page?: number;
  limit?: number;
  sortBy?: DepositSortBy;
  status?: DepositStatus;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  // Free-text match against depositNumber (apps/server/src/modules/deposit/deposit.repository.ts).
  search?: string;
}

// Mirrors apps/server/src/modules/deposit/deposit.validation.ts's
// createDepositSchema (POST /deposits). FormData-shaped rather than a plain
// object - that endpoint is multipart/form-data (it carries the screenshot
// file), same as usersService.uploadProfileImage's File param.
export interface CreateDepositPayload {
  packageAmount: number;
  paymentMethod: string;
  senderAccountNumber: string;
  paymentReference: string;
  screenshot: File;
}

// Mirrors apps/server/src/modules/deposit/deposit.validation.ts's rejectDepositSchema
// (PATCH /admin/deposits/:id/reject).
export interface RejectDepositPayload {
  rejectionReason: string;
}
