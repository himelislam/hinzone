import type { MarketHistory, Stock } from 'shared-types';

import type { MarketHistoryDocument } from './market-history.types';
import type { StockDocument, StockFilters, StockListOptions } from './stock.types';
import type { AdminStockListQuery, StockListQuery } from './stock.validation';

// Maps the internal Mongoose document to the exact client-safe shape shared
// with the frontend (id vs _id, ISO date strings vs Date objects) - same
// rationale as deposit.dto.ts's toDepositResponse.
export const toStockResponse = (stock: StockDocument): Stock => ({
  id: stock.id,
  symbol: stock.symbol,
  name: stock.name,
  companyName: stock.companyName,
  description: stock.description,
  category: stock.category,
  industry: stock.industry,
  logoUrl: stock.logoUrl,
  currentPrice: stock.currentPrice,
  previousPrice: stock.previousPrice,
  currency: stock.currency,
  dailyChange: stock.dailyChange,
  dailyChangePercentage: stock.dailyChangePercentage,
  totalShares: stock.totalShares,
  availableShares: stock.availableShares,
  minimumPurchase: stock.minimumPurchase,
  maximumPurchase: stock.maximumPurchase,
  allowFractionalShares: stock.allowFractionalShares,
  dividendEnabled: stock.dividendEnabled,
  status: stock.status,
  featured: stock.featured,
  displayOrder: stock.displayOrder,
  createdAt: stock.createdAt.toISOString(),
  updatedAt: stock.updatedAt.toISOString(),
});

export const toMarketHistoryResponse = (record: MarketHistoryDocument): MarketHistory => ({
  id: record.id,
  stockId: record.stockId.toString(),
  previousPrice: record.previousPrice,
  newPrice: record.newPrice,
  change: record.change,
  percentageChange: record.percentageChange,
  source: record.source,
  updatedBy: record.updatedBy?.toString(),
  createdAt: record.createdAt.toISOString(),
});

// Shared by stock.controller.ts's getStocks - query -> service-args split
// written once. Public listing has no status/featured params (scope is fixed
// server-side by stockService.getStocks/stockRepository.findPublic), so this
// only produces the narrower two-field filter shape that method accepts.
export const toStockListArgs = (
  query: StockListQuery,
): [StockListOptions, Omit<StockFilters, 'status' | 'featured'>] => [
  { page: query.page, limit: query.limit, sortBy: query.sortBy },
  {
    category: query.category,
    industry: query.industry,
    search: query.search,
  },
];

// admin-stock.controller.ts's listStocks - the admin superset (status/
// featured included), mirrors how depositListQuerySchema/toDepositListArgs
// is reused by both the user and admin deposit routes.
export const toAdminStockListArgs = (
  query: AdminStockListQuery,
): [StockListOptions, StockFilters] => [
  { page: query.page, limit: query.limit, sortBy: query.sortBy },
  {
    status: query.status,
    category: query.category,
    industry: query.industry,
    featured: query.featured,
    search: query.search,
  },
];
