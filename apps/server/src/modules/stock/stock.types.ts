import type { HydratedDocument, Model, Types } from 'mongoose';
import type { StockStatus } from 'shared-types';

// tasks/phase-07.md - Stock Schema. `symbol` is the unique, human-readable
// identifier (tasks/breakdown/phase-07-tasks.md decision 3 - no separate
// business-number generator like Deposit/Withdrawal's DEP-/WD- sequences).
// `previousPrice`/`dailyChange`/`dailyChangePercentage` are denormalized,
// recomputed by StockService.updatePrice() (Section D) on every price
// change rather than derived at read time, so list sorting by daily
// gain/loss can use a plain indexed field instead of an aggregation.
// `isDeleted`/`deletedAt`/`deletedBy` mirror users.types.ts's exact
// soft-delete shape - docs/04-folder-structure.md names Stock (unlike
// Deposit/Withdrawal/Transaction, which stay immutable and are never
// deleted) as a soft-delete entity.
export interface IStock {
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
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type StockDocument = HydratedDocument<IStock>;
export type StockModel = Model<IStock>;

// Every field the repository's create() persists - StockService.createStock()
// (Section D) is responsible for resolving Settings-seeded defaults
// (minimumPurchase/maximumPurchase/allowFractionalShares, decision 4) and
// computing previousPrice/availableShares/dailyChange/dailyChangePercentage
// before calling this, so none of it is optional here.
export interface CreateStockInput {
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
  availableShares: number;
  minimumPurchase: number;
  maximumPurchase: number;
  allowFractionalShares: boolean;
  dividendEnabled: boolean;
  featured: boolean;
  displayOrder: number;
}

// The PUT-editable metadata subset only - deliberately excludes
// currentPrice/previousPrice/status (tasks/breakdown/phase-07-tasks.md task
// 14/17's decision: those change only through updateStatus/updatePriceFields
// below, which also drive the MarketHistory write and dedicated audit
// actions a plain metadata update must not bypass).
export interface UpdateStockMetadataInput {
  symbol?: string;
  name?: string;
  companyName?: string;
  description?: string;
  category?: string;
  industry?: string;
  logoUrl?: string;
  totalShares?: number;
  minimumPurchase?: number;
  maximumPurchase?: number;
  allowFractionalShares?: boolean;
  dividendEnabled?: boolean;
  featured?: boolean;
  displayOrder?: number;
}

export interface UpdateStockPriceFieldsInput {
  previousPrice: number;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercentage: number;
}

export interface StockFilters {
  status?: StockStatus;
  category?: string;
  industry?: string;
  featured?: boolean;
  // Free-text match against symbol/name/companyName (stock.repository.ts's
  // buildFilterQuery) - phase-07.md's Search & Filtering section lists
  // these three together as the free-text targets, distinct from the
  // exact-match category/industry/status/featured filters above.
  search?: string;
}

// phase-07.md's Sorting section ("Name, Symbol, Price, Daily Gain, Daily
// Loss, Recently Updated") expanded into concrete asc/desc pairs, same
// expansion DEPOSIT_SORT_OPTIONS's highestAmount/lowestAmount pair already
// establishes for "Amount." A runtime constant (not just a type) so
// stock.validation.ts's z.enum() (Section C) can derive its accepted values
// from the same source this file's SORT_BY_TO_QUERY map is keyed by.
export const STOCK_SORT_OPTIONS = [
  'nameAsc',
  'nameDesc',
  'symbolAsc',
  'symbolDesc',
  'priceHighToLow',
  'priceLowToHigh',
  'dailyGainDesc',
  'dailyLossDesc',
  'recentlyUpdated',
] as const;
export type StockSortBy = (typeof STOCK_SORT_OPTIONS)[number];

export interface StockListOptions {
  page: number;
  limit: number;
  sortBy?: StockSortBy;
}

export interface PaginatedStocks {
  items: StockDocument[];
  total: number;
}
