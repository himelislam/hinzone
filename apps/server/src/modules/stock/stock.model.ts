import { Schema, model } from 'mongoose';
import { STOCK_STATUSES } from 'shared-constants';
import { StockStatus } from 'shared-types';

import type { IStock, StockModel } from './stock.types';

// tasks/phase-07.md - Stock Schema. `symbol` is the unique, human-readable
// identifier (tasks/breakdown/phase-07-tasks.md decision 3 - no business-
// number generator). `currentPrice`/`previousPrice`/`totalShares`/
// `availableShares`/`minimumPurchase`/`maximumPurchase` all carry `min: 0`
// as defense-in-depth alongside StockService's own settings-driven
// validation (database_rules.md #13/#18). `previousPrice` and
// `availableShares` have no schema-level default equal to another field
// (Mongoose defaults can't reference sibling fields) - StockService.createStock()
// (Section D) seeds `previousPrice = currentPrice` and
// `availableShares = totalShares` explicitly at creation time.
const stockSchema = new Schema<IStock, StockModel>(
  {
    symbol: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      // Defense-in-depth mirror of stockSymbolSchema's shape constraint
      // (packages/shared-validation/src/fields/stock-symbol.schema.ts), same
      // reasoning as this schema's numeric `min: 0` guards - any write that
      // bypasses stock.validation.ts is still bounded at the DB layer.
      maxlength: 10,
      match: /^[A-Z0-9.]{1,10}$/,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    industry: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    previousPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
    },
    dailyChange: {
      type: Number,
      required: true,
      default: 0,
    },
    dailyChangePercentage: {
      type: Number,
      required: true,
      default: 0,
    },
    totalShares: {
      type: Number,
      required: true,
      min: 0,
    },
    availableShares: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
    maximumPurchase: {
      type: Number,
      required: true,
      min: 0,
    },
    allowFractionalShares: {
      type: Boolean,
      required: true,
    },
    dividendEnabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: STOCK_STATUSES,
      default: StockStatus.ACTIVE,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
);

// phase-07.md's "Performance > Indexes" list (`unique: true` above already
// indexes `symbol`), plus compound indexes for the actual query shapes this
// module runs. Standalone `{ status: 1 }` / `{ featured: 1 }` indexes were
// deliberately left out: every status-scoped query in stock.repository.ts
// also filters `isDeleted` in the same call (findPublic/findAllAdmin), so a
// bare `status` index would never be used standalone - the compound indexes
// below already cover every prefix a real query needs.
stockSchema.index({ category: 1 });
stockSchema.index({ industry: 1 });
stockSchema.index({ createdAt: -1 });
// findPublic/findAllAdmin's default scope + sort (stock.repository.ts's
// paginate() defaults to recentlyUpdated).
stockSchema.index({ status: 1, isDeleted: 1, updatedAt: -1 });
// getDistinctCategories - lets Mongo satisfy GET /stocks/categories as an
// index-only DISTINCT_SCAN instead of collection-scanning every ACTIVE stock.
stockSchema.index({ status: 1, isDeleted: 1, category: 1 });
// findAllAdmin filtering by `featured` alone (no status filter) + the
// featured-flag sort order.
stockSchema.index({ featured: 1, displayOrder: 1 });
// findFeatured's exact filter+sort shape (status + featured equality prefix,
// then displayOrder) - the homepage/dashboard featured-stocks query, called
// out as high-traffic in this module's design.
stockSchema.index({ status: 1, featured: 1, displayOrder: 1 });

export const Stock = model<IStock, StockModel>('Stock', stockSchema, 'stocks');
