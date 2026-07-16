import type {
  Transaction,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  Wallet,
  WalletStatus,
} from 'shared-types';

// Mirrors apps/server/src/modules/wallet/transaction.types.ts's
// TRANSACTION_SORT_OPTIONS - duplicated here rather than shared, since it's a
// single 4-literal union with no other coupling to that server module.
export type TransactionSortBy = 'latest' | 'oldest' | 'highestAmount' | 'lowestAmount';

// Mirrors apps/server/src/modules/wallet/wallet.validation.ts's
// transactionQuerySchema (GET /wallet/transactions).
export interface TransactionListParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
  category?: TransactionCategory;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: TransactionSortBy;
  // Free-text match against transactionNumber/description
  // (apps/server/src/modules/wallet/transaction.repository.ts).
  search?: string;
}

// Mirrors apps/server/src/modules/wallet/wallet.validation.ts's
// adminWalletListQuerySchema (GET /admin/wallets).
export type AdminWalletSortBy =
  'createdAt' | 'availableBalance' | 'totalDeposited' | 'totalWithdrawn';

export interface AdminWalletListParams {
  page?: number;
  limit?: number;
  sort?: AdminWalletSortBy;
  order?: 'asc' | 'desc';
  status?: WalletStatus;
}

// Mirrors apps/server/src/modules/wallet/wallet.validation.ts's
// walletAdjustmentSchema (POST /admin/wallets/:id/adjust).
export interface AdjustWalletPayload {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  reason: string;
}

// Mirrors admin-wallet.controller.ts's adjustWallet response shape.
export interface AdjustWalletResult {
  wallet: Wallet;
  transaction: Transaction;
}
