import type { StockStatus } from '../enums/stock-status.enum';

// API-facing stock shape (tasks/phase-07.md - Stock Schema). Unlike
// Deposit/Withdrawal, a stock has no business-number generator - `symbol`
// (e.g. "AAPL") is itself the unique, human-readable identifier
// (tasks/breakdown/phase-07-tasks.md decision 3). `previousPrice`,
// `dailyChange`, and `dailyChangePercentage` are denormalized on the
// document (recomputed by StockService.updatePrice(), not derived at read
// time) so list sorting by daily gain/loss can use a plain indexed field.
// `minimumPurchase`/`maximumPurchase`/`allowFractionalShares` are seeded
// from StockSettings only when omitted at creation - once set, each Stock
// document is the sole authority for its own limits (decision 4).
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  companyName: string;
  description: string;
  category: string;
  industry: string;
  logoUrl?: string;
  currentPrice: number;
  previousPrice: number;
  currency: string;
  dailyChange: number;
  dailyChangePercentage: number;
  totalShares: number;
  // Tracked but never decremented in this phase - phase-07.md: "Do not
  // decrease available shares in this phase. That occurs in Trading."
  availableShares: number;
  minimumPurchase: number;
  maximumPurchase: number;
  allowFractionalShares: boolean;
  dividendEnabled: boolean;
  status: StockStatus;
  featured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
