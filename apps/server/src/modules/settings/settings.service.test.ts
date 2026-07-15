import { SettingsCategory } from 'shared-types';
import type { CurrencySettings, DepositSettings } from 'shared-types';

import { clearSettingsCache } from '@/shared/cache/settings-cache';
import { BusinessRuleError, NotFoundError } from '@/shared/errors';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';

import { settingsRepository } from './settings.repository';
import { settingsService } from './settings.service';
import type { SettingsDocument } from './settings.types';

jest.mock('./settings.repository');
jest.mock('../audit-log/audit-log.repository');

const mockedRepository = jest.mocked(settingsRepository);
const mockedAuditLogRepository = jest.mocked(auditLogRepository);

const ADMIN_ID = '507f1f77bcf86cd799439011';

const buildDocument = (category: SettingsCategory, data: unknown): SettingsDocument =>
  ({ category, data }) as unknown as SettingsDocument;

const VALID_CURRENCY: CurrencySettings = {
  defaultCurrency: 'BDT',
  currencySymbol: '৳',
  usdToBdtRate: 120,
  bdtToUsdRate: 0.00833,
  decimalPrecision: 2,
};

const VALID_DEPOSIT: DepositSettings = {
  enabled: true,
  packages: [{ amount: 3000 }],
  minimumDeposit: 3000,
  maximumDeposit: 100000,
  paymentMethods: ['bKash'],
};

beforeEach(() => {
  jest.clearAllMocks();
  clearSettingsCache();
});

describe('getByCategory', () => {
  it('reads through to the repository and caches the result on a miss', async () => {
    mockedRepository.findByCategory.mockResolvedValue(
      buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY),
    );

    const result = await settingsService.getByCategory(SettingsCategory.CURRENCY);

    expect(result).toEqual(VALID_CURRENCY);
    expect(mockedRepository.findByCategory).toHaveBeenCalledTimes(1);
  });

  it('serves a second read from the cache without querying the repository again', async () => {
    mockedRepository.findByCategory.mockResolvedValue(
      buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY),
    );

    await settingsService.getByCategory(SettingsCategory.CURRENCY);
    await settingsService.getByCategory(SettingsCategory.CURRENCY);

    expect(mockedRepository.findByCategory).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundError when the category has no document and is not cached', async () => {
    mockedRepository.findByCategory.mockResolvedValue(null);

    await expect(settingsService.getByCategory(SettingsCategory.SECURITY)).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('updateByCategory', () => {
  it('rejects invalid data before ever calling the repository', async () => {
    const invalid: DepositSettings = { ...VALID_DEPOSIT, minimumDeposit: 999999 };

    await expect(
      settingsService.updateByCategory(SettingsCategory.DEPOSIT, invalid, ADMIN_ID),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockedRepository.upsertByCategory).not.toHaveBeenCalled();
    expect(mockedAuditLogRepository.create).not.toHaveBeenCalled();
  });

  it('persists valid data, refreshes the cache, and writes an audit log entry', async () => {
    mockedRepository.upsertByCategory.mockResolvedValue(
      buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY),
    );

    const result = await settingsService.updateByCategory(
      SettingsCategory.CURRENCY,
      VALID_CURRENCY,
      ADMIN_ID,
      { ipAddress: '1.2.3.4', userAgent: 'jest' },
    );

    expect(result).toEqual(VALID_CURRENCY);
    expect(mockedRepository.upsertByCategory).toHaveBeenCalledWith(
      SettingsCategory.CURRENCY,
      VALID_CURRENCY,
      expect.anything(),
    );
    expect(mockedAuditLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AUDIT_ACTIONS.SETTINGS_UPDATED,
        entity: 'Settings',
        entityId: SettingsCategory.CURRENCY,
        before: undefined,
        after: VALID_CURRENCY,
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
      }),
    );

    // findByCategory was already called once above, to fetch the "before" snapshot
    // for the audit log (cache was cold). The cache is refreshed by the update
    // itself, so this subsequent read must not trigger a second repository call.
    const cachedRead = await settingsService.getByCategory(SettingsCategory.CURRENCY);
    expect(cachedRead).toEqual(VALID_CURRENCY);
    expect(mockedRepository.findByCategory).toHaveBeenCalledTimes(1);
  });

  it('captures the previously cached value as the audit log "before" snapshot', async () => {
    const updated = { ...VALID_CURRENCY, usdToBdtRate: 130 };
    mockedRepository.upsertByCategory
      .mockResolvedValueOnce(buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY))
      .mockResolvedValueOnce(buildDocument(SettingsCategory.CURRENCY, updated));

    await settingsService.updateByCategory(SettingsCategory.CURRENCY, VALID_CURRENCY, ADMIN_ID);
    await settingsService.updateByCategory(SettingsCategory.CURRENCY, updated, ADMIN_ID);

    expect(mockedAuditLogRepository.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ before: VALID_CURRENCY, after: updated }),
    );
  });
});

describe('warmCache', () => {
  it('populates the cache for every document returned by findAll', async () => {
    mockedRepository.findAll.mockResolvedValue([
      buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY),
      buildDocument(SettingsCategory.DEPOSIT, VALID_DEPOSIT),
    ]);

    await settingsService.warmCache();

    await expect(settingsService.getByCategory(SettingsCategory.CURRENCY)).resolves.toEqual(
      VALID_CURRENCY,
    );
    await expect(settingsService.getByCategory(SettingsCategory.DEPOSIT)).resolves.toEqual(
      VALID_DEPOSIT,
    );
    expect(mockedRepository.findByCategory).not.toHaveBeenCalled();
  });
});

describe('named per-category accessors', () => {
  it('getCurrency/updateCurrency delegate to the generic core for the CURRENCY category', async () => {
    mockedRepository.findByCategory.mockResolvedValue(
      buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY),
    );

    await expect(settingsService.getCurrency()).resolves.toEqual(VALID_CURRENCY);

    mockedRepository.upsertByCategory.mockResolvedValue(
      buildDocument(SettingsCategory.CURRENCY, VALID_CURRENCY),
    );

    await settingsService.updateCurrency(VALID_CURRENCY, ADMIN_ID);

    expect(mockedRepository.upsertByCategory).toHaveBeenCalledWith(
      SettingsCategory.CURRENCY,
      VALID_CURRENCY,
      expect.anything(),
    );
  });
});
