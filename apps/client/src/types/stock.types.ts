import type { StockStatus } from 'shared-types';

// Mirrors apps/server/src/modules/stock/stock.types.ts's STOCK_SORT_OPTIONS -
// duplicated here rather than shared, same reasoning as deposit.types.ts's
// DepositSortBy: a literal union with no other coupling to that server
// module.
export type StockSortBy =
  | 'nameAsc'
  | 'nameDesc'
  | 'symbolAsc'
  | 'symbolDesc'
  | 'priceHighToLow'
  | 'priceLowToHigh'
  | 'dailyGainDesc'
  | 'dailyLossDesc'
  | 'recentlyUpdated';

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// stockListQuerySchema (GET /stocks) - the public-facing subset. No status/
// featured params: public listing's status scope is fixed server-side
// (stockService.getStocks), and "featured only" has its own dedicated
// endpoint.
export interface StockListParams {
  page?: number;
  limit?: number;
  sortBy?: StockSortBy;
  category?: string;
  industry?: string;
  search?: string;
}

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// adminStockListQuerySchema (GET /admin/stocks) - StockListParams plus
// status/featured, the admin-only exact-match filters. Unlike
// WithdrawalListParams (one Zod schema shared by both the user and admin
// routes), the server validates two genuinely different schemas here, so
// the client mirrors that with a real extension rather than folding status/
// featured into the base type.
export interface AdminStockListParams extends StockListParams {
  status?: StockStatus;
  featured?: boolean;
}

// GET /stocks/:id/history query params - pagination only, no filters/sort
// (market-history.repository.ts's findByStockId is always newest-first).
export interface StockHistoryParams {
  page?: number;
  limit?: number;
}

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// createStockSchema (POST /admin/stocks). FormData-shaped rather than a
// plain object - that endpoint is multipart/form-data (it carries an
// optional logo file), same pattern as deposit.types.ts's
// CreateDepositPayload, except the file itself is optional here (a stock
// logo isn't required the way a deposit screenshot is). `currency` is
// deliberately absent - the server resolves it, never client-supplied.
export interface CreateStockPayload {
  symbol: string;
  name: string;
  companyName: string;
  description: string;
  category: string;
  industry: string;
  currentPrice: number;
  totalShares: number;
  minimumPurchase?: number;
  maximumPurchase?: number;
  allowFractionalShares?: boolean;
  dividendEnabled: boolean;
  featured: boolean;
  displayOrder: number;
  logo?: File;
}

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// updateStockSchema (PUT /admin/stocks/:id) - every create field, optional,
// plus the same optional logo file. currentPrice/status are deliberately
// absent (tasks/breakdown/phase-07-tasks.md task 14's decision - those
// change only through ChangeStockStatusPayload/UpdateStockPricePayload
// below, which drive their own dedicated audit actions a plain metadata
// update must not bypass).
export interface UpdateStockPayload {
  symbol?: string;
  name?: string;
  companyName?: string;
  description?: string;
  category?: string;
  industry?: string;
  totalShares?: number;
  minimumPurchase?: number;
  maximumPurchase?: number;
  allowFractionalShares?: boolean;
  dividendEnabled?: boolean;
  featured?: boolean;
  displayOrder?: number;
  logo?: File;
}

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// changeStockStatusSchema (PATCH /admin/stocks/:id/status).
export interface ChangeStockStatusPayload {
  status: StockStatus;
}

// Mirrors apps/server/src/modules/stock/stock.validation.ts's
// updateStockPriceSchema (PATCH /admin/stocks/:id/price).
export interface UpdateStockPricePayload {
  newPrice: number;
}
