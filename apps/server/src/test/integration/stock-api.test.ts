import request from 'supertest';
import { StockStatus } from 'shared-types';
import type { MarketHistory, Stock } from 'shared-types';

import app from '@/app';
import { MarketHistory as MarketHistoryModel } from '@/modules/stock/market-history.model';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { createTestAdmin, createTestStock } from '@/test/factories';
import { errorBody, paginatedBody, successBody } from '@/test/http';

// None of these endpoints call walletService or open a MongoDB transaction,
// so this file uses the standard, faster standalone test/db.ts helper rather
// than test/db-transactional.ts - same reasoning deposit-api.test.ts
// documents for its own non-transactional routes.
beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

describe('GET /api/v1/stocks', () => {
  it('returns only ACTIVE stock even when other statuses and a soft-deleted stock exist', async () => {
    const active = await createTestStock({ status: StockStatus.ACTIVE });
    await createTestStock({ status: StockStatus.INACTIVE });
    await createTestStock({ status: StockStatus.SUSPENDED });
    await createTestStock({ status: StockStatus.ARCHIVED });
    await createTestStock({ isDeleted: true, deletedAt: new Date() });

    const response = await request(app).get('/api/v1/stocks');

    expect(response.status).toBe(200);
    const items = paginatedBody<Stock>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(active.id);
  });

  it('filters by category', async () => {
    await createTestStock({ category: 'Finance' });
    const match = await createTestStock({ category: 'Technology' });

    const response = await request(app).get('/api/v1/stocks?category=Technology');

    const items = paginatedBody<Stock>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(match.id);
  });

  it('searches by symbol', async () => {
    const match = await createTestStock({ symbol: 'UNIQ1' });
    await createTestStock();

    const response = await request(app).get('/api/v1/stocks?search=UNIQ1');

    const items = paginatedBody<Stock>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(match.id);
  });

  it('sorts by priceHighToLow', async () => {
    await createTestStock({ currentPrice: 50 });
    await createTestStock({ currentPrice: 200 });

    const response = await request(app).get('/api/v1/stocks?sortBy=priceHighToLow');

    const items = paginatedBody<Stock>(response.body).data;
    expect(items[0]?.currentPrice).toBe(200);
  });

  it('paginates', async () => {
    await createTestStock();
    await createTestStock();
    await createTestStock();

    const response = await request(app).get('/api/v1/stocks?page=1&limit=2');

    const body = paginatedBody<Stock>(response.body);
    expect(body.data).toHaveLength(2);
    expect(body.pagination.total).toBe(3);
  });
});

describe('GET /api/v1/stocks/featured', () => {
  it('returns only featured ACTIVE stock, ordered by displayOrder', async () => {
    const second = await createTestStock({ featured: true, displayOrder: 2 });
    const first = await createTestStock({ featured: true, displayOrder: 1 });
    await createTestStock({ featured: false });

    const response = await request(app).get('/api/v1/stocks/featured');

    expect(response.status).toBe(200);
    const data = successBody<Stock[]>(response.body).data;
    expect(data.map((item) => item.id)).toEqual([first.id, second.id]);
  });
});

describe('GET /api/v1/stocks/categories', () => {
  it('returns distinct categories from ACTIVE stock', async () => {
    await createTestStock({ category: 'Technology' });
    await createTestStock({ category: 'Technology' });
    await createTestStock({ category: 'Finance', status: StockStatus.ARCHIVED });

    const response = await request(app).get('/api/v1/stocks/categories');

    expect(response.status).toBe(200);
    expect(successBody<string[]>(response.body).data).toEqual(['Technology']);
  });
});

describe('GET /api/v1/stocks/:id', () => {
  it('returns an ACTIVE stock', async () => {
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    const response = await request(app).get(`/api/v1/stocks/${stock.id}`);

    expect(response.status).toBe(200);
    expect(successBody<Stock>(response.body).data.id).toBe(stock.id);
  });

  it.each([StockStatus.INACTIVE, StockStatus.SUSPENDED, StockStatus.ARCHIVED])(
    'returns 404 for a %s stock',
    async (status) => {
      const stock = await createTestStock({ status });

      const response = await request(app).get(`/api/v1/stocks/${stock.id}`);

      expect(response.status).toBe(404);
      expect(errorBody(response.body).errorCode).toBe('STOCK_NOT_FOUND');
    },
  );

  it('returns 404 for a soft-deleted stock', async () => {
    const stock = await createTestStock({ isDeleted: true, deletedAt: new Date() });

    const response = await request(app).get(`/api/v1/stocks/${stock.id}`);

    expect(response.status).toBe(404);
  });

  it('returns 404 for a nonexistent id - same as a hidden stock, no existence leak', async () => {
    const response = await request(app).get('/api/v1/stocks/507f1f77bcf86cd799439011');

    expect(response.status).toBe(404);
    expect(errorBody(response.body).errorCode).toBe('STOCK_NOT_FOUND');
  });
});

describe('GET /api/v1/stocks/:id/history', () => {
  it('returns price history newest-first, paginated', async () => {
    const stock = await createTestStock({ status: StockStatus.ACTIVE });
    const { user: admin } = await createTestAdmin();

    await MarketHistoryModel.create({
      stockId: stock._id,
      previousPrice: 100,
      newPrice: 110,
      change: 10,
      percentageChange: 10,
      source: 'manual',
      updatedBy: admin._id,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await MarketHistoryModel.create({
      stockId: stock._id,
      previousPrice: 110,
      newPrice: 120,
      change: 10,
      percentageChange: 9.09,
      source: 'manual',
      updatedBy: admin._id,
    });

    const response = await request(app).get(`/api/v1/stocks/${stock.id}/history`);

    expect(response.status).toBe(200);
    const items = paginatedBody<MarketHistory>(response.body).data;
    expect(items).toHaveLength(2);
    expect(items[0]?.id).toBe(second.id);
  });

  it('returns 404 for a hidden (non-ACTIVE) stock, without exposing its history', async () => {
    const stock = await createTestStock({ status: StockStatus.ARCHIVED });

    const response = await request(app).get(`/api/v1/stocks/${stock.id}/history`);

    expect(response.status).toBe(404);
  });
});
