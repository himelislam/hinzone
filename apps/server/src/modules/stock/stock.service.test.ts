import { StockStatus } from 'shared-types';

import { StockNotFoundError } from '@/shared/errors';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { createTestStock } from '@/test/factories';

import { stockService } from './stock.service';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

describe('getStock', () => {
  it('returns an ACTIVE stock', async () => {
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    const result = await stockService.getStock(stock.id);

    expect(result.id).toBe(stock.id);
  });

  it.each([StockStatus.INACTIVE, StockStatus.SUSPENDED, StockStatus.ARCHIVED])(
    'throws StockNotFoundError for a %s stock',
    async (status) => {
      const stock = await createTestStock({ status });

      await expect(stockService.getStock(stock.id)).rejects.toBeInstanceOf(StockNotFoundError);
    },
  );

  it('throws StockNotFoundError for a soft-deleted stock', async () => {
    const stock = await createTestStock({ isDeleted: true, deletedAt: new Date() });

    await expect(stockService.getStock(stock.id)).rejects.toBeInstanceOf(StockNotFoundError);
  });

  it('throws StockNotFoundError for a nonexistent id', async () => {
    await expect(stockService.getStock('507f1f77bcf86cd799439011')).rejects.toBeInstanceOf(
      StockNotFoundError,
    );
  });
});

describe('getStocks', () => {
  it('never returns non-ACTIVE or soft-deleted stock, regardless of filters', async () => {
    await createTestStock({ status: StockStatus.ACTIVE });
    await createTestStock({ status: StockStatus.INACTIVE });
    await createTestStock({ status: StockStatus.SUSPENDED });
    await createTestStock({ status: StockStatus.ARCHIVED });
    await createTestStock({ status: StockStatus.ACTIVE, isDeleted: true, deletedAt: new Date() });

    const result = await stockService.getStocks({ page: 1, limit: 20 });

    expect(result.total).toBe(1);
    expect(result.items[0]?.status).toBe(StockStatus.ACTIVE);
  });

  it('matches search against symbol, name, and companyName', async () => {
    const bySymbol = await createTestStock({ symbol: 'ZZZZ' });
    const byName = await createTestStock({ name: 'Unique Name Corp' });
    const byCompanyName = await createTestStock({ companyName: 'Unique Company Widgets' });
    await createTestStock();

    const bySymbolResult = await stockService.getStocks({ page: 1, limit: 20 }, { search: 'ZZZZ' });
    expect(bySymbolResult.items.map((item) => item.id)).toEqual([bySymbol.id]);

    const byNameResult = await stockService.getStocks(
      { page: 1, limit: 20 },
      { search: 'Unique Name' },
    );
    expect(byNameResult.items.map((item) => item.id)).toEqual([byName.id]);

    const byCompanyResult = await stockService.getStocks(
      { page: 1, limit: 20 },
      { search: 'Unique Company' },
    );
    expect(byCompanyResult.items.map((item) => item.id)).toEqual([byCompanyName.id]);
  });

  it('filters by category and industry', async () => {
    await createTestStock({ category: 'Finance', industry: 'Banking' });
    const match = await createTestStock({ category: 'Technology', industry: 'Software' });

    const result = await stockService.getStocks(
      { page: 1, limit: 20 },
      { category: 'Technology', industry: 'Software' },
    );

    expect(result.items.map((item) => item.id)).toEqual([match.id]);
  });

  it('sorts by nameAsc/nameDesc', async () => {
    await createTestStock({ name: 'Alpha' });
    await createTestStock({ name: 'Beta' });

    const asc = await stockService.getStocks({ page: 1, limit: 20, sortBy: 'nameAsc' });
    expect(asc.items.map((item) => item.name)).toEqual(['Alpha', 'Beta']);

    const desc = await stockService.getStocks({ page: 1, limit: 20, sortBy: 'nameDesc' });
    expect(desc.items.map((item) => item.name)).toEqual(['Beta', 'Alpha']);
  });

  it('sorts by symbolAsc/symbolDesc', async () => {
    await createTestStock({ symbol: 'AAAA' });
    await createTestStock({ symbol: 'BBBB' });

    const asc = await stockService.getStocks({ page: 1, limit: 20, sortBy: 'symbolAsc' });
    expect(asc.items.map((item) => item.symbol)).toEqual(['AAAA', 'BBBB']);

    const desc = await stockService.getStocks({ page: 1, limit: 20, sortBy: 'symbolDesc' });
    expect(desc.items.map((item) => item.symbol)).toEqual(['BBBB', 'AAAA']);
  });

  it('sorts by priceHighToLow/priceLowToHigh', async () => {
    await createTestStock({ currentPrice: 50 });
    await createTestStock({ currentPrice: 150 });

    const highToLow = await stockService.getStocks({
      page: 1,
      limit: 20,
      sortBy: 'priceHighToLow',
    });
    expect(highToLow.items.map((item) => item.currentPrice)).toEqual([150, 50]);

    const lowToHigh = await stockService.getStocks({
      page: 1,
      limit: 20,
      sortBy: 'priceLowToHigh',
    });
    expect(lowToHigh.items.map((item) => item.currentPrice)).toEqual([50, 150]);
  });

  it('sorts by dailyGainDesc/dailyLossDesc', async () => {
    await createTestStock({ dailyChangePercentage: -5 });
    await createTestStock({ dailyChangePercentage: 10 });

    const gain = await stockService.getStocks({ page: 1, limit: 20, sortBy: 'dailyGainDesc' });
    expect(gain.items.map((item) => item.dailyChangePercentage)).toEqual([10, -5]);

    const loss = await stockService.getStocks({ page: 1, limit: 20, sortBy: 'dailyLossDesc' });
    expect(loss.items.map((item) => item.dailyChangePercentage)).toEqual([-5, 10]);
  });

  it('sorts by recentlyUpdated by default', async () => {
    const older = await createTestStock();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const newer = await createTestStock();

    const result = await stockService.getStocks({ page: 1, limit: 20 });

    expect(result.items[0]?.id).toBe(newer.id);
    expect(result.items[1]?.id).toBe(older.id);
  });

  it('paginates correctly', async () => {
    await createTestStock();
    await createTestStock();
    await createTestStock();

    const result = await stockService.getStocks({ page: 1, limit: 2 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});

describe('getFeaturedStocks', () => {
  it('returns only ACTIVE featured stock, sorted by displayOrder', async () => {
    const second = await createTestStock({ featured: true, displayOrder: 2 });
    const first = await createTestStock({ featured: true, displayOrder: 1 });
    await createTestStock({ featured: false });
    await createTestStock({ featured: true, status: StockStatus.INACTIVE });
    await createTestStock({ featured: true, isDeleted: true, deletedAt: new Date() });

    const result = await stockService.getFeaturedStocks();

    expect(result.map((item) => item.id)).toEqual([first.id, second.id]);
  });
});

describe('getCategories', () => {
  it('returns distinct categories from ACTIVE stock only', async () => {
    await createTestStock({ category: 'Technology' });
    await createTestStock({ category: 'Technology' });
    await createTestStock({ category: 'Finance', status: StockStatus.ARCHIVED });
    await createTestStock({ category: 'OnlyOnDeleted', isDeleted: true, deletedAt: new Date() });

    const categories = await stockService.getCategories();

    expect(categories).toEqual(['Technology']);
  });
});
