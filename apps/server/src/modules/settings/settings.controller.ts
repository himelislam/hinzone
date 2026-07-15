import { SETTINGS_CATEGORIES } from 'shared-constants';
import type { SettingsCategory, SettingsDataByCategory } from 'shared-types';
import type { Request, Response } from 'express';

import { successResponse } from '@/shared/response';

import { settingsService } from './settings.service';
import type { SettingsCategoryParams } from './settings.validation';

// Public reads (docs/20-settings-system.md #21) - no controller or business
// service outside this module may query the Settings collection directly
// (docs/20 #26), everything goes through settingsService's cache-first reads.
const getAllSettings = async (_req: Request, res: Response): Promise<void> => {
  const entries = await Promise.all(
    SETTINGS_CATEGORIES.map(
      async (category): Promise<[SettingsCategory, SettingsDataByCategory[SettingsCategory]]> => [
        category,
        await settingsService.getByCategory(category),
      ],
    ),
  );

  successResponse(res, Object.fromEntries(entries), 'Settings retrieved successfully.');
};

const getSettingsByCategory = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.params as unknown as SettingsCategoryParams;
  const data = await settingsService.getByCategory(category);

  successResponse(res, data, 'Settings retrieved successfully.');
};

export const settingsController = {
  getAllSettings,
  getSettingsByCategory,
};
