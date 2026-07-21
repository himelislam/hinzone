import { Types } from 'mongoose';

import { StockNotFoundError } from '@/shared/errors';
import { uploadImage } from '@/shared/helpers/upload-image';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';
import { settingsService } from '../settings/settings.service';

import {
  assertMinMaxPurchaseValid,
  assertNotDeleted,
  assertTotalSharesNotBelowAvailable,
  assertUniqueSymbol,
  assertValidPrice,
} from './stock-business-rules';
import { stockRepository } from './stock.repository';
import type {
  PaginatedStocks,
  StockDocument,
  StockFilters,
  StockListOptions,
  UpdateStockMetadataInput,
} from './stock.types';

// Catalog CRUD (create/update/list/get) for the admin controller
// (tasks/breakdown/phase-07-tasks.md task 26). State-transition operations
// (status change/archive/delete/price update) live in
// stock-lifecycle.service.ts instead, split out purely to keep both files
// under the 300-line Service limit (coding_rules.md #3) - same reasoning
// withdrawal.service.ts/withdrawal-review.service.ts's own split documents,
// not because these are a distinct domain concern.

// tasks/phase-07.md's Stock Image Upload section.
const STOCK_LOGO_UPLOAD_FOLDER = 'stocks';

// Mirrors deposit.service.ts's CreateDepositRequest precedent: the service
// layer declares its own request shape rather than importing
// stock.validation.ts's Zod-inferred type (backend_rules.md's layering keeps
// validation depending on nothing below it, not the reverse).
export interface CreateStockRequest {
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
}

export type UpdateStockRequest = UpdateStockMetadataInput;

export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
}

// tasks/phase-07.md's Create Stock workflow. `minimumPurchase`/
// `maximumPurchase`/`allowFractionalShares` are seeded from StockSettings
// only when the request omits them (tasks/breakdown/phase-07-tasks.md
// decision 4) - once set, the Stock document is the sole authority for its
// own limits. `previousPrice`/`availableShares` are seeded equal to
// `currentPrice`/`totalShares` at creation - stock.model.ts has no
// schema-level default for either, since a Mongoose default can't reference
// a sibling field.
const createStock = async (
  adminId: string,
  input: CreateStockRequest,
  file: UploadedFile | undefined,
  context: AuditContext = {},
): Promise<StockDocument> => {
  const [stockSettings, currencySettings] = await Promise.all([
    settingsService.getStock(),
    settingsService.getCurrency(),
  ]);

  const minimumPurchase = input.minimumPurchase ?? stockSettings.minimumPurchase;
  const maximumPurchase = input.maximumPurchase ?? stockSettings.maximumPurchase;
  const allowFractionalShares =
    input.allowFractionalShares ?? stockSettings.fractionalSharesEnabled;

  await assertUniqueSymbol(input.symbol);
  assertMinMaxPurchaseValid(minimumPurchase, maximumPurchase);
  assertValidPrice(input.currentPrice);

  const logoUrl = file
    ? await uploadImage(file.buffer, file.mimetype, STOCK_LOGO_UPLOAD_FOLDER, input.symbol)
    : undefined;

  const stock = await stockRepository.create({
    symbol: input.symbol,
    name: input.name,
    companyName: input.companyName,
    description: input.description,
    category: input.category,
    industry: input.industry,
    logoUrl,
    currentPrice: input.currentPrice,
    previousPrice: input.currentPrice,
    currency: currencySettings.defaultCurrency,
    dailyChange: 0,
    dailyChangePercentage: 0,
    totalShares: input.totalShares,
    availableShares: input.totalShares,
    minimumPurchase,
    maximumPurchase,
    allowFractionalShares,
    dividendEnabled: input.dividendEnabled,
    featured: input.featured,
    displayOrder: input.displayOrder,
  });

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.STOCK_CREATED,
    entity: 'Stock',
    entityId: stock.id,
    after: { symbol: stock.symbol, currentPrice: stock.currentPrice, status: stock.status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return stock;
};

// Metadata-only update (tasks/breakdown/phase-07-tasks.md task 14/17's
// decision) - currentPrice/previousPrice/status are never touched here, only
// through stock-lifecycle.service.ts's updatePrice/changeStatus, which also
// drive the MarketHistory write and their own dedicated audit actions that a
// plain metadata update must not bypass. Audit log carries only `after` (no
// `before`), same convention users-admin.service.ts's updateUserByAdmin
// already establishes for a generic metadata PATCH - `before` is reserved
// for real state transitions.
const updateStock = async (
  id: string,
  adminId: string,
  input: UpdateStockRequest,
  file: UploadedFile | undefined,
  context: AuditContext = {},
): Promise<StockDocument> => {
  const stock = await stockRepository.findByIdIncludingDeleted(id);

  if (!stock) {
    throw new StockNotFoundError();
  }

  assertNotDeleted(stock);

  if (input.symbol !== undefined && input.symbol !== stock.symbol) {
    await assertUniqueSymbol(input.symbol, stock.id);
  }

  if (input.minimumPurchase !== undefined || input.maximumPurchase !== undefined) {
    assertMinMaxPurchaseValid(
      input.minimumPurchase ?? stock.minimumPurchase,
      input.maximumPurchase ?? stock.maximumPurchase,
    );
  }

  if (input.totalShares !== undefined) {
    assertTotalSharesNotBelowAvailable(input.totalShares, stock.availableShares);
  }

  const update: UpdateStockMetadataInput = { ...input };

  if (file) {
    update.logoUrl = await uploadImage(
      file.buffer,
      file.mimetype,
      STOCK_LOGO_UPLOAD_FOLDER,
      stock.symbol,
    );
  }

  if (Object.keys(update).length === 0) {
    return stock;
  }

  const updated = await stockRepository.updateMetadata(stock._id, update);

  if (!updated) {
    throw new StockNotFoundError();
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.STOCK_UPDATED,
    entity: 'Stock',
    entityId: id,
    after: update,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

const listForAdmin = async (
  options: StockListOptions,
  filters: StockFilters = {},
): Promise<PaginatedStocks> => {
  return stockRepository.findAllAdmin(options, filters);
};

// Cross-status, includes soft-deleted stock - lets an admin open a
// just-deleted stock's detail page to confirm the deletion rather than
// getting a 404 immediately after their own action.
const getByIdForAdmin = async (id: string): Promise<StockDocument> => {
  const stock = await stockRepository.findByIdIncludingDeleted(id);

  if (!stock) {
    throw new StockNotFoundError();
  }

  return stock;
};

export const stockAdminService = {
  createStock,
  updateStock,
  listForAdmin,
  getByIdForAdmin,
};
