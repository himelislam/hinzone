import type { WalletStatus } from '../enums/wallet-status.enum';

// API-facing wallet shape shared by client and server (tasks/phase-04.md - Wallet
// Schema). Every user has exactly one wallet; balances are only ever mutated
// through WalletService, never assigned directly from this shape.
export interface Wallet {
  id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalProfit: number;
  totalInvestment: number;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

// Response shape for GET /wallet/summary (tasks/phase-04.md - Wallet Summary).
export interface WalletSummary {
  availableBalance: number;
  pendingBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalInvestment: number;
  totalProfit: number;
}
