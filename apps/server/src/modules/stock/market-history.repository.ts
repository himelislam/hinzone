import type { ClientSession, Types } from 'mongoose';

import { MarketHistory } from './market-history.model';
import type {
  CreateMarketHistoryInput,
  MarketHistoryDocument,
  MarketHistoryListOptions,
  PaginatedMarketHistory,
} from './market-history.types';

// Written inside the same session as the triggering
// stock.repository.ts#updatePriceFields call (Section D's
// StockService.updatePrice()) so the price fields and this record never
// diverge.
const create = async (
  data: CreateMarketHistoryInput,
  session?: ClientSession,
): Promise<MarketHistoryDocument> => {
  const [record] = await MarketHistory.create([data], { session });
  return record;
};

// Paginated, newest-first - backs GET /stocks/:id/history for both the
// public and admin controllers (Section E), same single method for both
// (tasks/breakdown/phase-07-tasks.md task 11 - price history carries no
// field worth restricting to admins only).
const findByStockId = async (
  stockId: Types.ObjectId,
  options: MarketHistoryListOptions,
): Promise<PaginatedMarketHistory> => {
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    MarketHistory.find({ stockId }).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
    MarketHistory.countDocuments({ stockId }).exec(),
  ]);

  return { items, total };
};

export const marketHistoryRepository = {
  create,
  findByStockId,
};
