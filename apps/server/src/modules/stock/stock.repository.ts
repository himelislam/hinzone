import type { ClientSession, QueryFilter, Types } from 'mongoose';
import { StockStatus } from 'shared-types';

import { escapeRegExp } from '@/shared/helpers/escape-regex';

import { Stock } from './stock.model';
import type {
  CreateStockInput,
  IStock,
  PaginatedStocks,
  StockDocument,
  StockFilters,
  StockListOptions,
  StockSortBy,
  UpdateStockMetadataInput,
  UpdateStockPriceFieldsInput,
} from './stock.types';

const create = async (data: CreateStockInput, session?: ClientSession): Promise<StockDocument> => {
  const [stock] = await Stock.create([data], { session });
  return stock;
};

const findById = async (id: string, session?: ClientSession): Promise<StockDocument | null> => {
  return Stock.findOne({ _id: id, isDeleted: { $ne: true } })
    .session(session ?? null)
    .exec();
};

// Admin-only escape hatch (tasks/breakdown/phase-07-tasks.md task 10) - lets
// stock-admin.service.ts's getByIdForAdmin/every write method still resolve a
// stock immediately after it was soft-deleted, same need
// users-admin.service.ts's deleteUser flow has for its own target lookup.
// Takes an optional session so updatePrice's transaction (Section D) can
// re-read the stock inside the same transaction it writes to, matching
// deposit.repository.ts's findById precedent.
const findByIdIncludingDeleted = async (
  id: string,
  session?: ClientSession,
): Promise<StockDocument | null> => {
  return Stock.findById(id)
    .session(session ?? null)
    .exec();
};

// Backs assertUniqueSymbol (Section C) - deliberately does NOT exclude
// isDeleted: the schema's `unique: true` index on `symbol` (stock.model.ts)
// applies across every document regardless of isDeleted, same as
// users.repository.ts's findByUsername/findByEmail/findByPhoneNumber never
// excluding isDeleted either - the uniqueness check must match the real
// database-level constraint scope, not a narrower one.
const findBySymbol = async (symbol: string): Promise<StockDocument | null> => {
  return Stock.findOne({ symbol: symbol.toUpperCase() }).exec();
};

const buildFilterQuery = (
  filters: StockFilters,
  scope: QueryFilter<IStock> = {},
): QueryFilter<IStock> => {
  const query: QueryFilter<IStock> = { ...scope };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.industry) {
    query.industry = filters.industry;
  }

  if (filters.featured !== undefined) {
    query.featured = filters.featured;
  }

  // phase-07.md's Search & Filtering - matches symbol/name/companyName, same
  // multi-field $or pattern as users-admin.service.ts's listUsers search.
  const search = filters.search?.trim();

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i');
    query.$or = [{ symbol: pattern }, { name: pattern }, { companyName: pattern }];
  }

  return query;
};

// phase-07.md's Sorting section ("Name, Symbol, Price, Daily Gain, Daily
// Loss, Recently Updated") mapped to STOCK_SORT_OPTIONS (stock.types.ts).
const SORT_BY_TO_QUERY: Record<StockSortBy, Record<string, 1 | -1>> = {
  nameAsc: { name: 1 },
  nameDesc: { name: -1 },
  symbolAsc: { symbol: 1 },
  symbolDesc: { symbol: -1 },
  priceHighToLow: { currentPrice: -1 },
  priceLowToHigh: { currentPrice: 1 },
  dailyGainDesc: { dailyChangePercentage: -1 },
  dailyLossDesc: { dailyChangePercentage: 1 },
  recentlyUpdated: { updatedAt: -1 },
};

const paginate = async (
  query: QueryFilter<IStock>,
  options: StockListOptions,
): Promise<PaginatedStocks> => {
  const sort = SORT_BY_TO_QUERY[options.sortBy ?? 'recentlyUpdated'];
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    Stock.find(query).sort(sort).skip(skip).limit(options.limit).exec(),
    Stock.countDocuments(query).exec(),
  ]);

  return { items, total };
};

// Public-facing - scope is always ACTIVE + not-deleted, never caller-supplied,
// so a public route can never accidentally return non-ACTIVE stock. `filters`
// structurally excludes `status` so a caller can't override the baked-in
// scope through buildFilterQuery's own status branch; `featured` is excluded
// for a different reason - "featured only" already has its own dedicated
// findFeatured() below, so the general listing's filter surface stays
// focused on catalog browsing rather than duplicating that endpoint's job.
const findPublic = async (
  options: StockListOptions,
  filters: Omit<StockFilters, 'status' | 'featured'> = {},
): Promise<PaginatedStocks> => {
  return paginate(
    buildFilterQuery(filters, { status: StockStatus.ACTIVE, isDeleted: { $ne: true } }),
    options,
  );
};

// Admin-facing, cross-status query (every status except soft-deleted) -
// backs GET /api/v1/admin/stocks.
const findAllAdmin = async (
  options: StockListOptions,
  filters: StockFilters = {},
): Promise<PaginatedStocks> => {
  return paginate(buildFilterQuery(filters, { isDeleted: { $ne: true } }), options);
};

// phase-07.md's Featured Stocks section ("Used on: Homepage, Dashboard,
// Investment Page") - a small, display-ordered set, not a paginated list.
const findFeatured = async (): Promise<StockDocument[]> => {
  return Stock.find({ status: StockStatus.ACTIVE, featured: true, isDeleted: { $ne: true } })
    .sort({ displayOrder: 1 })
    .exec();
};

// Backs GET /stocks/categories - distinct values already present on ACTIVE
// stock, rather than a separate Category collection (tasks/breakdown/
// phase-07-tasks.md task 22's decision).
const getDistinctCategories = async (): Promise<string[]> => {
  return Stock.distinct('category', {
    status: StockStatus.ACTIVE,
    isDeleted: { $ne: true },
  }).exec();
};

const updateMetadata = async (
  id: Types.ObjectId,
  update: UpdateStockMetadataInput,
): Promise<StockDocument | null> => {
  return Stock.findByIdAndUpdate(id, update, { new: true }).exec();
};

const updateStatus = async (
  id: Types.ObjectId,
  status: StockStatus,
): Promise<StockDocument | null> => {
  return Stock.findByIdAndUpdate(id, { status }, { new: true }).exec();
};

// Atomic with the triggering MarketHistory write via the caller-supplied
// session (Section D's StockService.updatePrice()).
const updatePriceFields = async (
  id: Types.ObjectId,
  update: UpdateStockPriceFieldsInput,
  session?: ClientSession,
): Promise<StockDocument | null> => {
  return Stock.findByIdAndUpdate(id, update, { new: true, session }).exec();
};

// Soft delete (database_rules.md #15) - same isDeleted/deletedAt/deletedBy
// field shape as users.model.ts.
const softDelete = async (
  id: Types.ObjectId,
  deletedBy: Types.ObjectId,
): Promise<StockDocument | null> => {
  return Stock.findByIdAndUpdate(
    id,
    { isDeleted: true, deletedAt: new Date(), deletedBy },
    { new: true },
  ).exec();
};

export const stockRepository = {
  create,
  findById,
  findByIdIncludingDeleted,
  findBySymbol,
  findPublic,
  findAllAdmin,
  findFeatured,
  getDistinctCategories,
  updateMetadata,
  updateStatus,
  updatePriceFields,
  softDelete,
};
