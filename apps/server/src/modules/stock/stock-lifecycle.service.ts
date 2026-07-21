import mongoose, { Types } from 'mongoose';
import { StockStatus } from 'shared-types';

import { StockNotFoundError } from '@/shared/errors';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditAction, AuditContext } from '../audit-log/audit-log.types';

import { marketHistoryRepository } from './market-history.repository';
import type { MarketHistoryDocument } from './market-history.types';
import { assertNotDeleted, assertValidPrice } from './stock-business-rules';
import { stockRepository } from './stock.repository';
import type { StockDocument } from './stock.types';

// State-transition operations on an existing stock - status changes,
// archiving, soft delete, and price updates - split out from
// stock-admin.service.ts purely to keep both files under the 300-line
// Service limit (coding_rules.md #3), same reasoning
// withdrawal.service.ts/withdrawal-review.service.ts's own split documents.

export type UpdatePriceResult = { stock: StockDocument; marketHistory: MarketHistoryDocument };

// Shared by changeStatus/archiveStock below - both apply the exact same
// status-transition write, differing only in which audit action they record
// (tasks/breakdown/phase-07-tasks.md task 18: archiveStock writes the
// distinct STOCK_ARCHIVED action instead of the generic STOCK_STATUS_CHANGED
// one, even though it's the same underlying field mutation).
const applyStatusChange = async (
  id: string,
  status: StockStatus,
  adminId: string,
  action: AuditAction,
  context: AuditContext,
): Promise<StockDocument> => {
  const stock = await stockRepository.findByIdIncludingDeleted(id);

  if (!stock) {
    throw new StockNotFoundError();
  }

  assertNotDeleted(stock);
  const previousStatus = stock.status;

  const updated = await stockRepository.updateStatus(stock._id, status);

  if (!updated) {
    throw new StockNotFoundError();
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action,
    entity: 'Stock',
    entityId: id,
    before: { status: previousStatus },
    after: { status },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

// Picks the audit action for a status transition - archiving into ARCHIVED
// always records the distinct STOCK_ARCHIVED action instead of the generic
// STOCK_STATUS_CHANGED one, even though it's the same underlying field
// mutation (tasks/breakdown/phase-07-tasks.md task 18). Resolved here, inside
// the service, rather than left as a decision each caller must remember to
// make - a caller that invoked changeStatus(id, ARCHIVED, ...) directly
// without knowing about a separate archiveStock() would otherwise silently
// record the wrong audit action.
const resolveStatusChangeAction = (status: StockStatus): AuditAction =>
  status === StockStatus.ARCHIVED
    ? AUDIT_ACTIONS.STOCK_ARCHIVED
    : AUDIT_ACTIONS.STOCK_STATUS_CHANGED;

// Stock has no linear status workflow to gate (unlike Withdrawal's
// PENDING -> APPROVED -> PROCESSING -> COMPLETED chain) - any StockStatus may
// transition to any other, per phase-07.md never describing restricted
// transitions (stock-business-rules.ts's assertNotDeleted is the only guard).
const changeStatus = async (
  id: string,
  status: StockStatus,
  adminId: string,
  context: AuditContext = {},
): Promise<StockDocument> => {
  return applyStatusChange(id, status, adminId, resolveStatusChangeAction(status), context);
};

// Thin convenience wrapper - archiving is just changeStatus targeting
// ARCHIVED; resolveStatusChangeAction already picks STOCK_ARCHIVED for that
// target, so this call site needs no special-casing of its own.
const archiveStock = async (
  id: string,
  adminId: string,
  context: AuditContext = {},
): Promise<StockDocument> => {
  return changeStatus(id, StockStatus.ARCHIVED, adminId, context);
};

// Soft delete (database_rules.md #15). Wallet/portfolio impact is out of
// scope entirely - Phase 08 (Trading/Portfolio) does not exist yet, so no
// position can reference this stock.
const deleteStock = async (
  id: string,
  adminId: string,
  context: AuditContext = {},
): Promise<StockDocument> => {
  const stock = await stockRepository.findByIdIncludingDeleted(id);

  if (!stock) {
    throw new StockNotFoundError();
  }

  assertNotDeleted(stock);

  const updated = await stockRepository.softDelete(stock._id, new Types.ObjectId(adminId));

  if (!updated) {
    throw new StockNotFoundError();
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.STOCK_DELETED,
    entity: 'Stock',
    entityId: id,
    before: { isDeleted: false },
    after: { isDeleted: true },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated;
};

// The one workflow operation in this module (mirrors DepositService.approveDeposit/
// WithdrawalService.completeWithdrawal's "the one operation with real
// side-effect sequencing" role, though - unlike those - there is no wallet
// transaction to wrap here, since no money moves in this phase). The price
// fields and the MarketHistory record must never diverge, so both writes
// share one MongoDB transaction even though neither is itself financial.
const updatePrice = async (
  id: string,
  newPrice: number,
  adminId: string,
  context: AuditContext = {},
): Promise<UpdatePriceResult> => {
  assertValidPrice(newPrice);

  const session = await mongoose.startSession();
  let previousPrice: number | undefined;

  try {
    let result: UpdatePriceResult | undefined;

    await session.withTransaction(async () => {
      // Re-read fresh inside the transaction (not before it starts) - same
      // stale-read-across-retry rationale as wallet-balance.service.ts's
      // mutateBalanceInSession.
      const stock = await stockRepository.findByIdIncludingDeleted(id, session);

      if (!stock) {
        throw new StockNotFoundError();
      }

      assertNotDeleted(stock);
      previousPrice = stock.currentPrice;

      const change = newPrice - stock.currentPrice;
      const percentageChange = stock.currentPrice === 0 ? 0 : (change / stock.currentPrice) * 100;

      const updatedStock = await stockRepository.updatePriceFields(
        stock._id,
        {
          previousPrice: stock.currentPrice,
          currentPrice: newPrice,
          dailyChange: change,
          dailyChangePercentage: percentageChange,
        },
        session,
      );

      if (!updatedStock) {
        throw new StockNotFoundError();
      }

      const marketHistory = await marketHistoryRepository.create(
        {
          stockId: stock._id,
          previousPrice: stock.currentPrice,
          newPrice,
          change,
          percentageChange,
          source: 'manual',
          updatedBy: new Types.ObjectId(adminId),
        },
        session,
      );

      result = { stock: updatedStock, marketHistory };
    });

    if (!result) {
      throw new StockNotFoundError();
    }

    // Audit logging happens after the transaction commits (auditLogRepository.create
    // has no session parameter) - matches deposit.service.ts's approveDeposit,
    // which also logs only once its own mutation has already committed.
    // before/after carry `currentPrice` only - the full before/after price
    // record already lives in the MarketHistory document just created, same
    // reasoning WITHDRAWAL_COMPLETED's audit log doesn't duplicate the ledger
    // Transaction's detail.
    await auditLogRepository.create({
      userId: new Types.ObjectId(adminId),
      action: AUDIT_ACTIONS.STOCK_PRICE_UPDATED,
      entity: 'Stock',
      entityId: id,
      before: { currentPrice: previousPrice },
      after: { currentPrice: newPrice },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return result;
  } finally {
    await session.endSession();
  }
};

export const stockLifecycleService = {
  changeStatus,
  archiveStock,
  deleteStock,
  updatePrice,
};
