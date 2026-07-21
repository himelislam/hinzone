import type { HydratedDocument, Model, Types } from 'mongoose';
import type { StockPriceUpdateMode } from 'shared-types';

// tasks/phase-07.md - Stock Price History. One record is created per
// StockService.updatePrice() call (Section D) - immutable after creation,
// same reasoning as transaction.types.ts's ITransaction / audit-log.types.ts's
// IAuditLog (deliberately no updatedAt). `source` reuses StockSettings' own
// StockPriceUpdateMode union rather than declaring a second, parallel
// manual/automatic type (tasks/breakdown/phase-07-tasks.md task 4). This
// phase only ever writes 'manual' with `updatedBy` set; 'automatic' (no
// `updatedBy`) is reserved for Phase 08's Auto Sell / price-feed updates.
export interface IMarketHistory {
  stockId: Types.ObjectId;
  previousPrice: number;
  newPrice: number;
  change: number;
  percentageChange: number;
  source: StockPriceUpdateMode;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
}

export type MarketHistoryDocument = HydratedDocument<IMarketHistory>;
export type MarketHistoryModel = Model<IMarketHistory>;

export interface CreateMarketHistoryInput {
  stockId: Types.ObjectId;
  previousPrice: number;
  newPrice: number;
  change: number;
  percentageChange: number;
  source: StockPriceUpdateMode;
  updatedBy?: Types.ObjectId;
}

export interface MarketHistoryListOptions {
  page: number;
  limit: number;
}

export interface PaginatedMarketHistory {
  items: MarketHistoryDocument[];
  total: number;
}
