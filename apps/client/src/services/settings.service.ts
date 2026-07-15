import type { ApiSuccessResponse, SettingsCategory, SettingsDataByCategory } from 'shared-types';

import { SETTINGS_ENDPOINTS } from '@/constants/settings-endpoints.constants';

import { apiClient } from './api';

// Every category's data, keyed the same way apps/server's SETTINGS_DEFAULTS is -
// the shape GET /settings actually returns (docs/20-settings-system.md #21).
export type AllSettings = { [C in SettingsCategory]: SettingsDataByCategory[C] };

const getAllSettings = async (): Promise<AllSettings> => {
  const response = await apiClient.get<ApiSuccessResponse<AllSettings>>(SETTINGS_ENDPOINTS.ALL);

  return response.data.data;
};

const getSettingsByCategory = async <C extends SettingsCategory>(
  category: C,
): Promise<SettingsDataByCategory[C]> => {
  const response = await apiClient.get<ApiSuccessResponse<SettingsDataByCategory[C]>>(
    SETTINGS_ENDPOINTS.BY_CATEGORY(category),
  );

  return response.data.data;
};

// Admin-only (enforced server-side by authenticate + authorize(ADMIN, SUPER_ADMIN),
// not here - see backend_rules.md #23 "never trust client-provided values").
const updateSettings = async <C extends SettingsCategory>(
  category: C,
  data: SettingsDataByCategory[C],
): Promise<SettingsDataByCategory[C]> => {
  const response = await apiClient.put<ApiSuccessResponse<SettingsDataByCategory[C]>>(
    SETTINGS_ENDPOINTS.ADMIN_UPDATE(category),
    data,
  );

  return response.data.data;
};

export const settingsService = {
  getAllSettings,
  getSettingsByCategory,
  updateSettings,
};
