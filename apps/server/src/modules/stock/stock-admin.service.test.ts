import { SettingsCategory, StockStatus } from 'shared-types';

import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { StockSymbolAlreadyExistsError, ValidationError } from '@/shared/errors';
import { uploadImage } from '@/shared/helpers/upload-image';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { createTestAdmin, createTestStock, uniqueStockSymbol } from '@/test/factories';

import type { CreateStockRequest } from './stock-admin.service';
import { stockAdminService } from './stock-admin.service';

// createStock/updateStock/listForAdmin/getByIdForAdmin don't compose a
// MongoDB transaction (unlike updatePrice, tested in
// stock-lifecycle.service.test.ts) - the standard standalone test/db.ts
// instance is enough, same reasoning deposit-api.test.ts documents for its
// own non-transactional routes. uploadImage is the only mock, since it's the
// sole external/network dependency (Cloudinary).
jest.mock('@/shared/helpers/upload-image');

const FAKE_LOGO_URL = 'https://res.cloudinary.com/test-cloud/image/upload/mock-logo.png';
const mockedUploadImage = jest.mocked(uploadImage);

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

beforeEach(() => {
  // mockClear() first - jest doesn't reset call history between tests by
  // default (no clearMocks/resetMocks in jest.config.ts), and several tests
  // in this file successfully call createStock/updateStock with a file, so a
  // later "not.toHaveBeenCalled()" assertion would otherwise see calls
  // accumulated from earlier tests.
  mockedUploadImage.mockClear();
  mockedUploadImage.mockResolvedValue(FAKE_LOGO_URL);
});

const validCreateInput = (overrides: Partial<CreateStockRequest> = {}): CreateStockRequest => ({
  symbol: uniqueStockSymbol(),
  name: 'Acme Corp',
  companyName: 'Acme Corporation Inc.',
  description: 'A test company.',
  category: 'Technology',
  industry: 'Software',
  currentPrice: 100,
  totalShares: 1000,
  dividendEnabled: false,
  featured: false,
  displayOrder: 0,
  ...overrides,
});

describe('createStock', () => {
  it('seeds previousPrice/availableShares from currentPrice/totalShares and fills omitted limits from StockSettings', async () => {
    const { user: admin } = await createTestAdmin();
    const stockSettings = SETTINGS_DEFAULTS[SettingsCategory.STOCKS];

    const stock = await stockAdminService.createStock(admin.id, validCreateInput(), undefined);

    expect(stock.previousPrice).toBe(stock.currentPrice);
    expect(stock.availableShares).toBe(stock.totalShares);
    expect(stock.status).toBe(StockStatus.ACTIVE);
    expect(stock.currency).toBe(SETTINGS_DEFAULTS[SettingsCategory.CURRENCY].defaultCurrency);
    expect(stock.minimumPurchase).toBe(stockSettings.minimumPurchase);
    expect(stock.maximumPurchase).toBe(stockSettings.maximumPurchase);
    expect(stock.allowFractionalShares).toBe(stockSettings.fractionalSharesEnabled);
  });

  it('honors an explicitly-supplied minimumPurchase/maximumPurchase/allowFractionalShares instead of the Settings default', async () => {
    const { user: admin } = await createTestAdmin();

    const stock = await stockAdminService.createStock(
      admin.id,
      validCreateInput({ minimumPurchase: 25, maximumPurchase: 250, allowFractionalShares: true }),
      undefined,
    );

    expect(stock.minimumPurchase).toBe(25);
    expect(stock.maximumPurchase).toBe(250);
    expect(stock.allowFractionalShares).toBe(true);
  });

  it('rejects a duplicate symbol', async () => {
    const { user: admin } = await createTestAdmin();
    const existing = await createTestStock();

    await expect(
      stockAdminService.createStock(
        admin.id,
        validCreateInput({ symbol: existing.symbol }),
        undefined,
      ),
    ).rejects.toBeInstanceOf(StockSymbolAlreadyExistsError);
  });

  it('rejects when maximumPurchase is less than minimumPurchase', async () => {
    const { user: admin } = await createTestAdmin();

    await expect(
      stockAdminService.createStock(
        admin.id,
        validCreateInput({ minimumPurchase: 100, maximumPurchase: 50 }),
        undefined,
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a non-positive currentPrice', async () => {
    const { user: admin } = await createTestAdmin();

    await expect(
      stockAdminService.createStock(admin.id, validCreateInput({ currentPrice: 0 }), undefined),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('uploads the logo, keyed by symbol, and stores its URL when a file is provided', async () => {
    const { user: admin } = await createTestAdmin();
    const input = validCreateInput();

    const stock = await stockAdminService.createStock(admin.id, input, {
      buffer: Buffer.from('fake-logo-data'),
      mimetype: 'image/png',
    });

    expect(stock.logoUrl).toBe(FAKE_LOGO_URL);
    expect(mockedUploadImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/png',
      'stocks',
      input.symbol,
    );
  });

  it('leaves logoUrl unset when no file is provided', async () => {
    const { user: admin } = await createTestAdmin();

    const stock = await stockAdminService.createStock(admin.id, validCreateInput(), undefined);

    expect(stock.logoUrl).toBeUndefined();
    expect(mockedUploadImage).not.toHaveBeenCalled();
  });
});

describe('updateStock', () => {
  it('updates the requested metadata fields only', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ name: 'Old Name', category: 'Finance' });

    const updated = await stockAdminService.updateStock(
      stock.id,
      admin.id,
      { name: 'New Name' },
      undefined,
    );

    expect(updated.name).toBe('New Name');
    expect(updated.category).toBe('Finance');
  });

  it("re-uploads the logo, keyed by the stock's existing symbol, and overwrites logoUrl", async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock();

    const updated = await stockAdminService.updateStock(
      stock.id,
      admin.id,
      {},
      {
        buffer: Buffer.from('new-logo-data'),
        mimetype: 'image/png',
      },
    );

    expect(updated.logoUrl).toBe(FAKE_LOGO_URL);
    expect(mockedUploadImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'image/png',
      'stocks',
      stock.symbol,
    );
  });

  it('rejects a symbol change that collides with a different existing stock', async () => {
    const { user: admin } = await createTestAdmin();
    const other = await createTestStock();
    const stock = await createTestStock();

    await expect(
      stockAdminService.updateStock(stock.id, admin.id, { symbol: other.symbol }, undefined),
    ).rejects.toBeInstanceOf(StockSymbolAlreadyExistsError);
  });

  it('allows "changing" symbol to its own current value without a false-positive conflict', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock();

    const updated = await stockAdminService.updateStock(
      stock.id,
      admin.id,
      { symbol: stock.symbol },
      undefined,
    );

    expect(updated.symbol).toBe(stock.symbol);
  });

  it('rejects lowering totalShares below the current availableShares', async () => {
    const { user: admin } = await createTestAdmin();
    const stock = await createTestStock({ totalShares: 1000, availableShares: 800 });

    await expect(
      stockAdminService.updateStock(stock.id, admin.id, { totalShares: 500 }, undefined),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('listForAdmin', () => {
  it('filters by status', async () => {
    const active = await createTestStock({ status: StockStatus.ACTIVE });
    await createTestStock({ status: StockStatus.ARCHIVED });

    const result = await stockAdminService.listForAdmin(
      { page: 1, limit: 20 },
      { status: StockStatus.ACTIVE },
    );

    expect(result.items.map((item) => item.id)).toEqual([active.id]);
  });

  it('filters by featured', async () => {
    const featured = await createTestStock({ featured: true });
    await createTestStock({ featured: false });

    const result = await stockAdminService.listForAdmin({ page: 1, limit: 20 }, { featured: true });

    expect(result.items.map((item) => item.id)).toEqual([featured.id]);
  });

  it('includes every status except soft-deleted', async () => {
    await createTestStock({ status: StockStatus.ARCHIVED });
    await createTestStock({ isDeleted: true, deletedAt: new Date() });

    const result = await stockAdminService.listForAdmin({ page: 1, limit: 20 });

    expect(result.total).toBe(1);
  });
});

describe('getByIdForAdmin', () => {
  it('resolves a soft-deleted stock (admin escape hatch)', async () => {
    const stock = await createTestStock({ isDeleted: true, deletedAt: new Date() });

    const result = await stockAdminService.getByIdForAdmin(stock.id);

    expect(result.id).toBe(stock.id);
  });
});
