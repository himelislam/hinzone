import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import { SettingsCategory } from 'shared-types';
import type {
  CurrencySettings,
  DepositSettings,
  GeneralSettings,
  HomepageSettings,
  MlmSettings,
  NotificationSettings,
  SecuritySettings,
  StockSettings,
  TradingSettings,
  WithdrawalSettings,
} from 'shared-types';

import type { AllSettings } from '@/services/settings.service';
import { settingsService } from '@/services/settings.service';

// Hierarchical so invalidating ['settings'] (useSettingsMutations.ts) covers every
// per-category key underneath it too.
export const SETTINGS_QUERY_KEYS = {
  all: ['settings'] as const,
  category: (category: SettingsCategory) => ['settings', category] as const,
};

// Settings rarely change and are already cached server-side (docs/20-settings-system.md
// #23) - a longer staleTime avoids refetching the same rarely-changing config on
// every mount, same rationale as useAuthMutations.ts's useCurrentUser.
const SETTINGS_STALE_TIME_MS = 5 * 60 * 1000;

export const useSettings = (): UseQueryResult<AllSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.all,
    queryFn: settingsService.getAllSettings,
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useGeneralSettings = (): UseQueryResult<GeneralSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.GENERAL),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.GENERAL),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useCurrencySettings = (): UseQueryResult<CurrencySettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.CURRENCY),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.CURRENCY),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useDepositSettings = (): UseQueryResult<DepositSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.DEPOSIT),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.DEPOSIT),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useWithdrawalSettings = (): UseQueryResult<WithdrawalSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.WITHDRAWAL),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.WITHDRAWAL),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useTradingSettings = (): UseQueryResult<TradingSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.TRADING),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.TRADING),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useStockSettings = (): UseQueryResult<StockSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.STOCKS),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.STOCKS),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useMlmSettings = (): UseQueryResult<MlmSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.MLM),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.MLM),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useHomepageSettings = (): UseQueryResult<HomepageSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.HOMEPAGE),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.HOMEPAGE),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useNotificationSettings = (): UseQueryResult<NotificationSettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.NOTIFICATIONS),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.NOTIFICATIONS),
    staleTime: SETTINGS_STALE_TIME_MS,
  });

export const useSecuritySettings = (): UseQueryResult<SecuritySettings, Error> =>
  useQuery({
    queryKey: SETTINGS_QUERY_KEYS.category(SettingsCategory.SECURITY),
    queryFn: () => settingsService.getSettingsByCategory(SettingsCategory.SECURITY),
    staleTime: SETTINGS_STALE_TIME_MS,
  });
