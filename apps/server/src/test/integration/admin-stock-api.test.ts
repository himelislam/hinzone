import request from 'supertest';
import { StockStatus } from 'shared-types';
import type { Stock } from 'shared-types';

import app from '@/app';
import { AuditLog } from '@/modules/audit-log/audit-log.model';
import { AUDIT_ACTIONS } from '@/modules/audit-log/audit-log.types';
import { MarketHistory } from '@/modules/stock/market-history.model';
import { uploadImage } from '@/shared/helpers/upload-image';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import {
  authHeaderFor,
  createTestAdmin,
  createTestStock,
  createTestUser,
  uniqueStockSymbol,
} from '@/test/factories';
import { errorBody, paginatedBody, successBody } from '@/test/http';

// PATCH /admin/stocks/:id/price composes stockRepository.updatePriceFields +
// marketHistoryRepository.create into its own MongoDB transaction
// (stock-lifecycle.service.ts's updatePrice), which only a replica set
// supports - see test/db-transactional.ts. Every other route works fine
// against the same replica-set-backed connection, so the whole file shares
// one beforeAll - same reasoning admin-deposit-api.test.ts documents.
// uploadImage is mocked to avoid a real Cloudinary call.
jest.mock('@/shared/helpers/upload-image');
jest.setTimeout(30000);

const FAKE_LOGO_URL = 'https://res.cloudinary.com/test-cloud/image/upload/mock-logo.png';
const mockedUploadImage = jest.mocked(uploadImage);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

beforeEach(() => {
  // mockClear() first - jest doesn't reset call history between tests by
  // default (no clearMocks/resetMocks in jest.config.ts), and several tests
  // in this file successfully create/update a stock with a logo file, so a
  // later "not.toHaveBeenCalled()" assertion would otherwise see calls
  // accumulated from earlier tests.
  mockedUploadImage.mockClear();
  mockedUploadImage.mockResolvedValue(FAKE_LOGO_URL);
});

// Every multipart request below matches the seeded STOCK settings defaults
// (settings-defaults.ts: minimumPurchase 1, maximumPurchase 1000) unless a
// test overrides a field to exercise a rejection.
const validCreateFields = (overrides: Record<string, string> = {}): Record<string, string> => ({
  symbol: uniqueStockSymbol(),
  name: 'Acme Corp',
  companyName: 'Acme Corporation Inc.',
  description: 'A test company.',
  category: 'Technology',
  industry: 'Software',
  currentPrice: '100',
  totalShares: '1000',
  ...overrides,
});

const attachStockFields = (agent: request.Test, fields: Record<string, string>): request.Test => {
  let req = agent;

  for (const [key, value] of Object.entries(fields)) {
    req = req.field(key, value);
  }

  return req;
};

describe('POST /api/v1/admin/stocks', () => {
  it('creates a stock with a logo file', async () => {
    const { user: admin } = await createTestAdmin();

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(admin)),
      validCreateFields(),
    ).attach('logo', Buffer.from('fake-logo-data'), {
      filename: 'logo.png',
      contentType: 'image/png',
    });

    expect(response.status).toBe(201);
    const data = successBody<Stock>(response.body).data;
    expect(data.logoUrl).toBe(FAKE_LOGO_URL);
    expect(data.status).toBe(StockStatus.ACTIVE);
  });

  it('creates a stock without a logo file', async () => {
    const { user: admin } = await createTestAdmin();

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(admin)),
      validCreateFields(),
    );

    expect(response.status).toBe(201);
    expect(mockedUploadImage).not.toHaveBeenCalled();
  });

  it('rejects a duplicate symbol with 409', async () => {
    const { user: admin } = await createTestAdmin();
    const existing = await createTestStock();

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(admin)),
      validCreateFields({ symbol: existing.symbol }),
    );

    expect(response.status).toBe(409);
    expect(errorBody(response.body).errorCode).toBe('STOCK_SYMBOL_ALREADY_EXISTS');
  });

  // assertMinMaxPurchaseValid (stock-business-rules.ts) throws ValidationError
  // (422), not BusinessRuleError (400) - task 13's own spec.
  it('rejects maximumPurchase below minimumPurchase with 422', async () => {
    const { user: admin } = await createTestAdmin();

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(admin)),
      validCreateFields({ minimumPurchase: '100', maximumPurchase: '50' }),
    );

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });

  // phase-07.md's Validation section requires "Positive Shares" -
  // totalSharesField (stock.validation.ts) is `.positive()`, not
  // `.nonnegative()`.
  it('rejects a non-positive totalShares with 422', async () => {
    const { user: admin } = await createTestAdmin();

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(admin)),
      validCreateFields({ totalShares: '0' }),
    );

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing required field with 422', async () => {
    const { user: admin } = await createTestAdmin();
    const fields = validCreateFields();

    delete fields.name;

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(admin)),
      fields,
    );

    expect(response.status).toBe(422);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();

    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks').set('Authorization', authHeaderFor(user)),
      validCreateFields(),
    );

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await attachStockFields(
      request(app).post('/api/v1/admin/stocks'),
      validCreateFields(),
    );

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/admin/stocks', () => {
  it('returns every status including ARCHIVED, excluding soft-deleted', async () => {
    const { user: admin } = await createTestAdmin();
    const active = await createTestStock({ status: StockStatus.ACTIVE });
    const archived = await createTestStock({ status: StockStatus.ARCHIVED });
    await createTestStock({ isDeleted: true, deletedAt: new Date() });

    const response = await request(app)
      .get('/api/v1/admin/stocks')
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const ids = paginatedBody<Stock>(response.body).data.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([active.id, archived.id]));
    expect(ids).toHaveLength(2);
  });

  it('filters by status and featured', async () => {
    const { user: admin } = await createTestAdmin();
    const match = await createTestStock({ status: StockStatus.ACTIVE, featured: true });
    await createTestStock({ status: StockStatus.ACTIVE, featured: false });
    await createTestStock({ status: StockStatus.ARCHIVED, featured: true });

    const response = await request(app)
      .get('/api/v1/admin/stocks?status=ACTIVE&featured=true')
      .set('Authorization', authHeaderFor(admin));

    const items = paginatedBody<Stock>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(match.id);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/admin/stocks')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/admin/stocks');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/admin/stocks/:id', () => {
  it('returns a stock for an admin, regardless of status', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: StockStatus.ARCHIVED });

    const response = await request(app)
      .get(`/api/v1/admin/stocks/${stock.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Stock>(response.body).data.id).toBe(stock.id);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const stock = await createTestStock();

    const response = await request(app)
      .get(`/api/v1/admin/stocks/${stock.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/v1/admin/stocks/:id', () => {
  it('updates metadata fields', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock();

    const response = await attachStockFields(
      request(app)
        .put(`/api/v1/admin/stocks/${stock.id}`)
        .set('Authorization', authHeaderFor(admin)),
      { name: 'Renamed Corp' },
    );

    expect(response.status).toBe(200);
    expect(successBody<Stock>(response.body).data.name).toBe('Renamed Corp');
  });

  // Task 14's decision - currentPrice/status are excluded from
  // updateStockSchema entirely, so submitting them in the PUT body has no
  // effect: they never reach stockRepository.updateMetadata. Confirms the
  // decision holds in the real route, not just the design intent.
  it('silently ignores currentPrice and status in the request body', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ currentPrice: 100, status: StockStatus.ACTIVE });

    const response = await attachStockFields(
      request(app)
        .put(`/api/v1/admin/stocks/${stock.id}`)
        .set('Authorization', authHeaderFor(admin)),
      { currentPrice: '999', status: 'ARCHIVED' },
    );

    expect(response.status).toBe(200);
    const data = successBody<Stock>(response.body).data;
    expect(data.currentPrice).toBe(100);
    expect(data.status).toBe(StockStatus.ACTIVE);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const stock = await createTestStock();

    const response = await attachStockFields(
      request(app)
        .put(`/api/v1/admin/stocks/${stock.id}`)
        .set('Authorization', authHeaderFor(user)),
      { name: 'Renamed Corp' },
    );

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/stocks/:id/status', () => {
  it('transitions to any status and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    const response = await request(app)
      .patch(`/api/v1/admin/stocks/${stock.id}/status`)
      .set('Authorization', authHeaderFor(admin))
      .send({ status: 'SUSPENDED' });

    expect(response.status).toBe(200);
    expect(successBody<Stock>(response.body).data.status).toBe('SUSPENDED');

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_STATUS_CHANGED);
  });

  it('writes STOCK_ARCHIVED (not the generic action) when transitioning to ARCHIVED', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    await request(app)
      .patch(`/api/v1/admin/stocks/${stock.id}/status`)
      .set('Authorization', authHeaderFor(admin))
      .send({ status: 'ARCHIVED' });

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_ARCHIVED);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const stock = await createTestStock();

    const response = await request(app)
      .patch(`/api/v1/admin/stocks/${stock.id}/status`)
      .set('Authorization', authHeaderFor(user))
      .send({ status: 'INACTIVE' });

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/stocks/:id/price', () => {
  it('updates currentPrice, creates exactly one MarketHistory row for the right stock, and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ currentPrice: 100 });

    const response = await request(app)
      .patch(`/api/v1/admin/stocks/${stock.id}/price`)
      .set('Authorization', authHeaderFor(admin))
      .send({ newPrice: 150 });

    expect(response.status).toBe(200);
    expect(successBody<Stock>(response.body).data.currentPrice).toBe(150);

    const history = await MarketHistory.find({ stockId: stock._id }).exec();
    expect(history).toHaveLength(1);
    expect(history[0]?.newPrice).toBe(150);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_PRICE_UPDATED);
  });

  // assertValidPrice (stock-business-rules.ts) throws ValidationError (422),
  // not BusinessRuleError (400).
  it('rejects a non-positive price with 422', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock();

    const response = await request(app)
      .patch(`/api/v1/admin/stocks/${stock.id}/price`)
      .set('Authorization', authHeaderFor(admin))
      .send({ newPrice: 0 });

    expect(response.status).toBe(422);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const stock = await createTestStock();

    const response = await request(app)
      .patch(`/api/v1/admin/stocks/${stock.id}/price`)
      .set('Authorization', authHeaderFor(user))
      .send({ newPrice: 150 });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/v1/admin/stocks/:id', () => {
  it('soft-deletes the stock, hides it from both lists, but keeps it fetchable by id for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ status: StockStatus.ACTIVE });

    const response = await request(app)
      .delete(`/api/v1/admin/stocks/${stock.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);

    const adminList = await request(app)
      .get('/api/v1/admin/stocks')
      .set('Authorization', authHeaderFor(admin));
    expect(paginatedBody<Stock>(adminList.body).data.map((item) => item.id)).not.toContain(
      stock.id,
    );

    const publicList = await request(app).get('/api/v1/stocks');
    expect(paginatedBody<Stock>(publicList.body).data.map((item) => item.id)).not.toContain(
      stock.id,
    );

    const byId = await request(app)
      .get(`/api/v1/admin/stocks/${stock.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(byId.status).toBe(200);

    const logs = await AuditLog.find({ entity: 'Stock', entityId: stock.id }).exec();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe(AUDIT_ACTIONS.STOCK_DELETED);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const stock = await createTestStock();

    const response = await request(app)
      .delete(`/api/v1/admin/stocks/${stock.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const stock = await createTestStock();

    const response = await request(app).delete(`/api/v1/admin/stocks/${stock.id}`);

    expect(response.status).toBe(401);
  });
});
