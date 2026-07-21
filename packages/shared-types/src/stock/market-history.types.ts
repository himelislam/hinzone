import type { StockPriceUpdateMode } from '../settings/stock-settings.types';

// API-facing price-history shape (tasks/phase-07.md - Stock Price History).
// One record is created per StockService.updatePrice() call - immutable
// after creation, same reasoning as Transaction/AuditLog (no `updatedAt`).
// `source` reuses StockSettings' own StockPriceUpdateMode union rather than
// declaring a second, parallel manual/automatic type
// (tasks/breakdown/phase-07-tasks.md task 4). This phase only ever writes
// 'manual' with `updatedBy` set; 'automatic' (no `updatedBy`) is reserved for
// Phase 08's Auto Sell / price-feed updates.
export interface MarketHistory {
  id: string;
  stockId: string;
  previousPrice: number;
  newPrice: number;
  change: number;
  percentageChange: number;
  source: StockPriceUpdateMode;
  updatedBy?: string;
  createdAt: string;
}
