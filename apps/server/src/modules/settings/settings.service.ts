import { Types } from 'mongoose';
import { SettingsCategory } from 'shared-types';
import type {
  CurrencySettings,
  DepositSettings,
  GeneralSettings,
  HomepageSettings,
  MlmSettings,
  NotificationSettings,
  SecuritySettings,
  SettingsDataByCategory,
  StockSettings,
  TradingSettings,
  WithdrawalSettings,
} from 'shared-types';

import { getCachedSettings, setCachedSettings } from '@/shared/cache/settings-cache';
import { NotFoundError } from '@/shared/errors';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';

import { validateSettingsData } from './settings-business-rules';
import { settingsRepository } from './settings.repository';

// docs/20-settings-system.md #5's read flow: check cache first, fall back to
// MongoDB on a miss, then cache the result - this lazily warms the cache one
// category at a time as each is first requested. warmCache() below covers
// "load everything on boot" for categories that haven't been requested yet.
const getByCategory = async <C extends SettingsCategory>(
  category: C,
): Promise<SettingsDataByCategory[C]> => {
  const cached = getCachedSettings(category);

  if (cached !== undefined) {
    return cached as SettingsDataByCategory[C];
  }

  const document = await settingsRepository.findByCategory(category);

  if (!document) {
    throw new NotFoundError(`Settings category "${category}" has not been configured yet.`);
  }

  setCachedSettings(category, document.data);

  return document.data as SettingsDataByCategory[C];
};

// docs/20-settings-system.md #24: persist, then refresh the cache immediately so
// the new values are live for the very next read - never wait for a TTL or a
// restart. docs/20 #27: every update also creates an immutable audit log entry
// with the previous and new values.
const updateByCategory = async <C extends SettingsCategory>(
  category: C,
  data: SettingsDataByCategory[C],
  adminId: string,
  context: AuditContext = {},
): Promise<SettingsDataByCategory[C]> => {
  validateSettingsData(category, data);

  // Cache-first, same as getByCategory() - avoids a redundant DB read for the
  // "before" snapshot when the category is already warm.
  const cachedBefore = getCachedSettings(category);
  const before =
    cachedBefore !== undefined
      ? cachedBefore
      : (await settingsRepository.findByCategory(category))?.data;

  const updated = await settingsRepository.upsertByCategory(
    category,
    data,
    new Types.ObjectId(adminId),
  );

  setCachedSettings(category, updated.data);

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.SETTINGS_UPDATED,
    entity: 'Settings',
    entityId: category,
    before,
    after: updated.data,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return updated.data as SettingsDataByCategory[C];
};

// Populates the cache for every category that already exists in MongoDB - called
// once during server startup (server.ts), before the app starts accepting
// requests (docs/20-settings-system.md #23).
const warmCache = async (): Promise<void> => {
  const documents = await settingsRepository.findAll();

  for (const document of documents) {
    setCachedSettings(document.category, document.data);
  }
};

export const settingsService = {
  getGeneral: (): Promise<GeneralSettings> => getByCategory(SettingsCategory.GENERAL),
  getCurrency: (): Promise<CurrencySettings> => getByCategory(SettingsCategory.CURRENCY),
  getDeposit: (): Promise<DepositSettings> => getByCategory(SettingsCategory.DEPOSIT),
  getWithdrawal: (): Promise<WithdrawalSettings> => getByCategory(SettingsCategory.WITHDRAWAL),
  getTrading: (): Promise<TradingSettings> => getByCategory(SettingsCategory.TRADING),
  getStock: (): Promise<StockSettings> => getByCategory(SettingsCategory.STOCKS),
  getMLM: (): Promise<MlmSettings> => getByCategory(SettingsCategory.MLM),
  getHomepage: (): Promise<HomepageSettings> => getByCategory(SettingsCategory.HOMEPAGE),
  getNotification: (): Promise<NotificationSettings> =>
    getByCategory(SettingsCategory.NOTIFICATIONS),
  getSecurity: (): Promise<SecuritySettings> => getByCategory(SettingsCategory.SECURITY),

  updateGeneral: (
    data: GeneralSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<GeneralSettings> => updateByCategory(SettingsCategory.GENERAL, data, adminId, context),
  updateCurrency: (
    data: CurrencySettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<CurrencySettings> =>
    updateByCategory(SettingsCategory.CURRENCY, data, adminId, context),
  updateDeposit: (
    data: DepositSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<DepositSettings> => updateByCategory(SettingsCategory.DEPOSIT, data, adminId, context),
  updateWithdrawal: (
    data: WithdrawalSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<WithdrawalSettings> =>
    updateByCategory(SettingsCategory.WITHDRAWAL, data, adminId, context),
  updateTrading: (
    data: TradingSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<TradingSettings> => updateByCategory(SettingsCategory.TRADING, data, adminId, context),
  updateStock: (
    data: StockSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<StockSettings> => updateByCategory(SettingsCategory.STOCKS, data, adminId, context),
  updateMLM: (
    data: MlmSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<MlmSettings> => updateByCategory(SettingsCategory.MLM, data, adminId, context),
  updateHomepage: (
    data: HomepageSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<HomepageSettings> =>
    updateByCategory(SettingsCategory.HOMEPAGE, data, adminId, context),
  updateNotification: (
    data: NotificationSettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<NotificationSettings> =>
    updateByCategory(SettingsCategory.NOTIFICATIONS, data, adminId, context),
  updateSecurity: (
    data: SecuritySettings,
    adminId: string,
    context: AuditContext = {},
  ): Promise<SecuritySettings> =>
    updateByCategory(SettingsCategory.SECURITY, data, adminId, context),

  getByCategory,
  updateByCategory,
  warmCache,
};
