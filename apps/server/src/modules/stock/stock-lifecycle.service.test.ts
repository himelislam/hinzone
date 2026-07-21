import { StockStatus } from 'shared-types';

import { AuditLog } from '@/modules/audit-log/audit-log.model';
import { AUDIT_ACTIONS } from '@/modules/audit-log/audit-log.types';
import { BusinessRuleError, ValidationError } from '@/shared/errors';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import { createTestAdmin, createTestStock } from '@/test/factories';

import { MarketHistory } from './market-history.model';
import { marketHistoryRepository } from './market-history.repository';
import { stockLifecycleService } from './stock-lifecycle.service';
import { Stock } from './stock.model';

// updatePrice composes stockRepository.updatePriceFields +
// marketHistoryRepository.create into its own MongoDB transaction
// (stock-lifecycle.service.ts), which only a replica set supports - see
// test/db-transactional.ts. changeStatus/archiveStock/deleteStock don't need
// it individually, but sharing one connection for the whole file matches
// deposit.service.test.ts's own reasoning for consolidating onto one DB
// connection per file.
jest.setTimeout(30000);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

// Reverses jest.spyOn(marketHistoryRepository, 'create') in the rollback test
// even if an assertion before its own restoration throws - same rationale as
// deposit.service.test.ts's identical afterEach.
afterEach(() => {
  jest.restoreAllMocks();
});

describe('changeStatus', () => {
  it.each([
    [StockStatus.ACTIVE, StockStatus.INACTIVE],
    [StockStatus.INACTIVE, StockStatus.SUSPENDED],
    [StockStatus.SUSPENDED, StockStatus.INACTIVE],
    [StockStatus.ARCHIVED, StockStatus.ACTIVE],
  ])('transitions %s -> %s and writes STOCK_STATUS_CHANGED', async (from, to) => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: from });

    const updated = await stockLifecycleService.changeStatus(stock.id, to, admin.id);

    expect(updated.status).toBe(to);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_STATUS_CHANGED);
  });

  // The exact scenario the audit-action-in-the-controller bug was about: a
  // caller invoking changeStatus() directly with ARCHIVED as the target
  // (bypassing archiveStock()) must still record the distinct STOCK_ARCHIVED
  // action, not the generic one - resolveStatusChangeAction (stock-lifecycle.service.ts)
  // picks the action from the target status itself, not from which exported
  // function happened to be called.
  it('writes STOCK_ARCHIVED (not the generic action) when called directly with ARCHIVED as the target', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    const updated = await stockLifecycleService.changeStatus(
      stock.id,
      StockStatus.ARCHIVED,
      admin.id,
    );

    expect(updated.status).toBe(StockStatus.ARCHIVED);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_ARCHIVED);
  });

  it('throws when the stock has already been deleted', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: admin._id,
    });

    await expect(
      stockLifecycleService.changeStatus(stock.id, StockStatus.INACTIVE, admin.id),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });
});

describe('archiveStock', () => {
  it('sets status to ARCHIVED and writes the distinct STOCK_ARCHIVED action', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    const updated = await stockLifecycleService.archiveStock(stock.id, admin.id);

    expect(updated.status).toBe(StockStatus.ARCHIVED);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_ARCHIVED);
  });

  it('throws when the stock has already been deleted', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: admin._id,
    });

    await expect(stockLifecycleService.archiveStock(stock.id, admin.id)).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });
});

describe('deleteStock', () => {
  it('soft-deletes the stock and writes STOCK_DELETED', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock();

    const updated = await stockLifecycleService.deleteStock(stock.id, admin.id);

    expect(updated.isDeleted).toBe(true);
    expect(updated.deletedAt).toBeInstanceOf(Date);
    expect(updated.deletedBy?.toString()).toBe(admin.id);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_DELETED);
  });

  it('throws when the stock has already been deleted', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: admin._id,
    });

    await expect(stockLifecycleService.deleteStock(stock.id, admin.id)).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
  });
});

describe('updatePrice', () => {
  it('updates currentPrice/previousPrice/dailyChange/dailyChangePercentage and creates one MarketHistory record', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ currentPrice: 100 });

    const result = await stockLifecycleService.updatePrice(stock.id, 120, admin.id);

    expect(result.stock.currentPrice).toBe(120);
    expect(result.stock.previousPrice).toBe(100);
    expect(result.stock.dailyChange).toBe(20);
    expect(result.stock.dailyChangePercentage).toBeCloseTo(20);

    expect(result.marketHistory.previousPrice).toBe(100);
    expect(result.marketHistory.newPrice).toBe(120);
    expect(result.marketHistory.change).toBe(20);
    expect(result.marketHistory.percentageChange).toBeCloseTo(20);
    expect(result.marketHistory.source).toBe('manual');
    expect(result.marketHistory.updatedBy?.toString()).toBe(admin.id);

    expect(await MarketHistory.countDocuments({ stockId: stock._id })).toBe(1);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_PRICE_UPDATED);
  });

  it('rejects a non-positive newPrice, creating no MarketHistory record', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock();

    await expect(stockLifecycleService.updatePrice(stock.id, 0, admin.id)).rejects.toBeInstanceOf(
      ValidationError,
    );

    expect(await MarketHistory.countDocuments({ stockId: stock._id })).toBe(0);
  });

  // Task 30 - force a mid-transaction failure (marketHistoryRepository.create,
  // which runs *after* stockRepository.updatePriceFields inside the same
  // session.withTransaction callback) and assert the whole operation rolled
  // back atomically: no MarketHistory persisted, the stock's price fields
  // unchanged. Same technique as deposit.service.test.ts's approveDeposit
  // rollback test.
  it('rolls back the price fields if the MarketHistory write fails mid-transaction', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ currentPrice: 100 });

    jest
      .spyOn(marketHistoryRepository, 'create')
      .mockRejectedValueOnce(new Error('Simulated failure after updatePriceFields ran'));

    await expect(stockLifecycleService.updatePrice(stock.id, 150, admin.id)).rejects.toThrow(
      'Simulated failure after updatePriceFields ran',
    );

    const persisted = await Stock.findById(stock.id).exec();
    expect(persisted?.currentPrice).toBe(100);

    expect(await MarketHistory.countDocuments({ stockId: stock._id })).toBe(0);
  });
});
