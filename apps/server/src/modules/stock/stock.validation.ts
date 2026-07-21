import { z } from 'zod';
import { StockStatus } from 'shared-types';
import { amountSchema, stockSymbolSchema } from 'shared-validation';

import { STOCK_SORT_OPTIONS } from './stock.types';

// multer stringifies every non-file multipart field, including numbers and
// booleans - these two preprocessors convert the raw string before handing
// off to a reused shared-validation schema (or a plain z.boolean()/z.number()),
// same technique deposit.validation.ts's packageAmount preprocessor already
// established for its own multipart numeric field. A JSON caller sending an
// actual number/boolean still passes through untouched. An empty string
// (how a blank text/number input serializes in FormData) maps to `undefined`
// rather than falling through to `Number('')`/`Boolean('')` - both evaluate
// to falsy-but-defined (`0`/`false`), which would let a blank required field
// silently pass a `.nonnegative()`/boolean check instead of failing with a
// "required" error.
const toNumberIfString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() === '' ? undefined : Number(value);
};

const toBooleanIfString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim() === '' ? undefined : value === 'true';
};

// Field-level validators shared between createStockSchema and
// updateStockSchema below (both required and optional-for-update forms
// derive from the same base), so a future constraint change only has one
// place to edit instead of two hand-duplicated copies silently drifting
// apart.
const nameField = z.string().trim().min(1, 'Name is required.');
const companyNameField = z.string().trim().min(1, 'Company name is required.');
const descriptionField = z.string().trim().min(1, 'Description is required.');
const categoryField = z.string().trim().min(1, 'Category is required.');
const industryField = z.string().trim().min(1, 'Industry is required.');
// phase-07.md's Validation section requires "Positive Shares" - a stock with
// 0 total shares has nothing to ever sell, so this is `.positive()`, not
// `.nonnegative()` (unlike totalShares' Mongoose-layer `min: 0`, which stays
// a loose defense-in-depth floor - see stock.model.ts's comment on why
// currentPrice's own `min: 0` doesn't mirror amountSchema's stricter
// `.positive()` either).
const totalSharesField = z.preprocess(
  toNumberIfString,
  z.number().positive('Total shares must be greater than zero.').finite(),
);
// Omitted-and-defaulted from StockSettings when absent
// (tasks/breakdown/phase-07-tasks.md decision 4) - StockService.createStock()
// (Section D) fills these in when omitted, not this schema. Already optional
// on create, so update reuses it unchanged rather than layering a second
// `.optional()` on top.
const minimumPurchaseField = z.preprocess(toNumberIfString, amountSchema.optional());
const maximumPurchaseField = z.preprocess(toNumberIfString, amountSchema.optional());
const allowFractionalSharesField = z.preprocess(toBooleanIfString, z.boolean().optional());

// POST /api/v1/admin/stocks body (tasks/phase-07.md - Stock Schema + Admin
// Stock Form). The `logo` file itself is validated by the uploadStockLogo
// multer middleware (this file's sibling change in middlewares/upload.ts),
// not here - same split as deposit.validation.ts's screenshot upload.
// `currency` is deliberately not a field here - unlike deposit's
// user-chosen paymentMethod, a stock's currency isn't client-supplied;
// StockService.createStock() (Section D) resolves it server-side.
export const createStockSchema = z.object({
  symbol: stockSymbolSchema,
  name: nameField,
  companyName: companyNameField,
  description: descriptionField,
  category: categoryField,
  industry: industryField,
  currentPrice: z.preprocess(toNumberIfString, amountSchema),
  totalShares: totalSharesField,
  minimumPurchase: minimumPurchaseField,
  maximumPurchase: maximumPurchaseField,
  allowFractionalShares: allowFractionalSharesField,
  dividendEnabled: z.preprocess(toBooleanIfString, z.boolean().default(false)),
  featured: z.preprocess(toBooleanIfString, z.boolean().default(false)),
  displayOrder: z.preprocess(toNumberIfString, z.number().int().nonnegative().default(0)),
});

// PUT /api/v1/admin/stocks/:id body - the PUT-editable metadata subset only.
// Deliberately excludes currentPrice/previousPrice/status
// (tasks/breakdown/phase-07-tasks.md task 14's decision): changing those
// bypasses the MarketHistory recording and dedicated audit action that
// updateStockPriceSchema/changeStockStatusSchema's own endpoints require.
// Unlike create, `symbol` is optional-but-editable here (phase-07.md's Admin
// Stock Form lists "Symbol" as a field) - re-validated through
// assertUniqueSymbol with excludeStockId at the service layer (Section D).
export const updateStockSchema = z.object({
  symbol: stockSymbolSchema.optional(),
  name: nameField.optional(),
  companyName: companyNameField.optional(),
  description: descriptionField.optional(),
  category: categoryField.optional(),
  industry: industryField.optional(),
  totalShares: z.preprocess(
    toNumberIfString,
    z.number().positive('Total shares must be greater than zero.').finite().optional(),
  ),
  minimumPurchase: minimumPurchaseField,
  maximumPurchase: maximumPurchaseField,
  allowFractionalShares: allowFractionalSharesField,
  dividendEnabled: z.preprocess(toBooleanIfString, z.boolean().optional()),
  featured: z.preprocess(toBooleanIfString, z.boolean().optional()),
  displayOrder: z.preprocess(toNumberIfString, z.number().int().nonnegative().optional()),
});

// PATCH /api/v1/admin/stocks/:id/status body - plain JSON, no multipart
// concern.
export const changeStockStatusSchema = z.object({
  status: z.nativeEnum(StockStatus),
});

// PATCH /api/v1/admin/stocks/:id/price body - plain JSON, no multipart
// concern.
export const updateStockPriceSchema = z.object({
  newPrice: amountSchema,
});

// GET /api/v1/stocks query params (tasks/phase-07.md's Search & Filtering +
// Pagination sections) - the public-facing subset. No status/featured params:
// public listing's status scope is fixed to ACTIVE server-side
// (stock.repository.ts's findPublic), and "featured only" has its own
// dedicated GET /stocks/featured endpoint/method.
export const stockListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(STOCK_SORT_OPTIONS).default('recentlyUpdated'),
  category: z.string().trim().min(1).optional(),
  industry: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
});

// GET /api/v1/admin/stocks query params - stockListQuerySchema plus
// status/featured, mirrors how depositListQuerySchema is reused by both the
// user and admin deposit routes, except here the admin variant is a strict
// superset (public listing's scope is fixed server-side, not
// client-selectable). `featured` deliberately avoids z.coerce.boolean():
// Boolean("false") evaluates to `true` in JavaScript, so z.coerce.boolean()
// would treat the literal query string "false" as true; parsing via
// enum-then-transform reads only the two strings that can actually appear.
export const adminStockListQuerySchema = stockListQuerySchema.extend({
  status: z.nativeEnum(StockStatus).optional(),
  featured: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

// GET /api/v1/stocks/:id/history query params - pagination only, no filters/
// sort (market-history.repository.ts's findByStockId is always newest-first).
export const stockHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateStockRequestBody = z.infer<typeof createStockSchema>;
export type UpdateStockRequestBody = z.infer<typeof updateStockSchema>;
export type ChangeStockStatusRequestBody = z.infer<typeof changeStockStatusSchema>;
export type UpdateStockPriceRequestBody = z.infer<typeof updateStockPriceSchema>;
export type StockListQuery = z.infer<typeof stockListQuerySchema>;
export type AdminStockListQuery = z.infer<typeof adminStockListQuerySchema>;
export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>;
