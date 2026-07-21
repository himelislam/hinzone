import { Types } from 'mongoose';
import { StockStatus } from 'shared-types';

import { StockNotFoundError } from '@/shared/errors';

import { marketHistoryRepository } from './market-history.repository';
import type { MarketHistoryListOptions, PaginatedMarketHistory } from './market-history.types';
import { stockRepository } from './stock.repository';
import type { PaginatedStocks, StockDocument, StockFilters, StockListOptions } from './stock.types';

// tasks/phase-07.md's public StockService methods (getStock/getStocks/
// getFeaturedStocks/getCategories), plus getPriceHistory, which backs both
// this module's future public controller and stock-admin.service.ts's admin
// detail-page history tab (tasks/breakdown/phase-07-tasks.md task 22 - no
// field on a MarketHistory record is worth restricting once its parent stock
// is visible). Admin write operations (create/update/status/price/delete)
// and cross-status admin reads live in stock-admin.service.ts instead - same
// file-per-controller-group split wallet-admin.service.ts/
// users-admin.service.ts already established over their own domain modules.

// A mismatched id, a non-ACTIVE stock, and a soft-deleted stock are all
// indistinguishable 404s to a public caller - same non-enumeration
// convention documented on StockNotFoundError itself.
const getStock = async (id: string): Promise<StockDocument> => {
  const stock = await stockRepository.findById(id);

  if (!stock || stock.status !== StockStatus.ACTIVE) {
    throw new StockNotFoundError();
  }

  return stock;
};

const getStocks = async (
  options: StockListOptions,
  filters: Omit<StockFilters, 'status' | 'featured'> = {},
): Promise<PaginatedStocks> => {
  return stockRepository.findPublic(options, filters);
};

const getFeaturedStocks = async (): Promise<StockDocument[]> => {
  return stockRepository.findFeatured();
};

// Distinct category values already present on ACTIVE stock (tasks/breakdown/
// phase-07-tasks.md task 22's decision) rather than a separate Category
// collection.
const getCategories = async (): Promise<string[]> => {
  return stockRepository.getDistinctCategories();
};

// The caller (the future public/admin controllers, Section E) is responsible
// for confirming the parent stock is visible to it first (getStock for
// public, stockAdminService.getByIdForAdmin for admin) - this method itself
// is a plain passthrough, same boundary marketHistoryRepository.findByStockId
// already draws around a single collection.
const getPriceHistory = async (
  stockId: string,
  options: MarketHistoryListOptions,
): Promise<PaginatedMarketHistory> => {
  return marketHistoryRepository.findByStockId(new Types.ObjectId(stockId), options);
};

export const stockService = {
  getStock,
  getStocks,
  getFeaturedStocks,
  getCategories,
  getPriceHistory,
};
