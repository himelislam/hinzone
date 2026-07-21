import { Schema, model } from 'mongoose';

import type { IMarketHistory, MarketHistoryModel } from './market-history.types';

// tasks/phase-07.md - Stock Price History. One record per
// StockService.updatePrice() call (Section D) - immutable, same
// `{ timestamps: { createdAt: true, updatedAt: false } }` option as
// audit-log.model.ts/transaction.model.ts's precedent for collections that
// are never edited after creation. `source` is an inline two-value enum
// (mirrors StockPriceUpdateMode, 'manual' | 'automatic') rather than a
// shared-constants array - unlike StockStatus, this union isn't reused
// anywhere else as a Mongoose schema enum, so a dedicated constants file
// would be redundant for two literals.
const marketHistorySchema = new Schema<IMarketHistory, MarketHistoryModel>(
  {
    stockId: {
      type: Schema.Types.ObjectId,
      ref: 'Stock',
      required: true,
    },
    previousPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    newPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    change: {
      type: Number,
      required: true,
    },
    percentageChange: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      enum: ['manual', 'automatic'],
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Backs GET /stocks/:id/history (market-history.repository.ts's
// findByStockId), paginated newest-first.
marketHistorySchema.index({ stockId: 1, createdAt: -1 });

// database_rules.md #3's collections list names this collection `marketHistory`
// (singular), unlike every other collection here which is plural - matched
// exactly rather than following the plural convention.
export const MarketHistory = model<IMarketHistory, MarketHistoryModel>(
  'MarketHistory',
  marketHistorySchema,
  'marketHistory',
);
