import type { HydratedDocument, Model, Types } from 'mongoose';
import type { WalletStatus } from 'shared-types';

// tasks/phase-04.md - Wallet Schema. Every user has exactly one wallet
// (unique index on userId in wallet.model.ts); balances are only ever mutated
// through WalletService (backend_rules.md #10), never assigned directly.
export interface IWallet {
  userId: Types.ObjectId;
  availableBalance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalProfit: number;
  totalInvestment: number;
  currency: string;
  status: WalletStatus;
  // Populated by Mongoose via the `timestamps: true` schema option.
  createdAt: Date;
  updatedAt: Date;
}

export type WalletDocument = HydratedDocument<IWallet>;
export type WalletModel = Model<IWallet>;

export interface CreateWalletInput {
  userId: Types.ObjectId;
  // No default at the schema level - the caller resolves this from the
  // Settings-driven currency config (coding_rules.md #14), never a hardcoded value.
  currency: string;
}

// Fields updateBalance is allowed to $inc in a single atomic call - excludes
// `status`, which has its own dedicated updateStatus method.
export type WalletBalanceField =
  | 'availableBalance'
  | 'pendingBalance'
  | 'totalDeposited'
  | 'totalWithdrawn'
  | 'totalProfit'
  | 'totalInvestment';

export type WalletBalanceIncrements = Partial<Record<WalletBalanceField, number>>;

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedWallets {
  items: WalletDocument[];
  total: number;
}
