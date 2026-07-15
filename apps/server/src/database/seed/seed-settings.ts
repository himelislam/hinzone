import { SETTINGS_CATEGORIES } from 'shared-constants';

import { validateSettingsData } from '@/modules/settings/settings-business-rules';
import { settingsRepository } from '@/modules/settings/settings.repository';
import { logger } from '@/shared/logger';

import { SETTINGS_DEFAULTS } from './settings-defaults';

// Idempotent - only inserts a category that has no document yet, so re-running
// this (e.g. on every deploy) never overwrites values an admin already changed
// (phase-03.md "Default Seeder": if Settings already exist, skip).
export const seedSettings = async (): Promise<void> => {
  for (const category of SETTINGS_CATEGORIES) {
    const existing = await settingsRepository.findByCategory(category);

    if (existing) {
      logger.info(`Settings category "${category}" already exists. Skipping.`);
      continue;
    }

    const data = SETTINGS_DEFAULTS[category];
    validateSettingsData(category, data);
    await settingsRepository.upsertByCategory(category, data);

    logger.info(`Seeded default settings for category "${category}".`);
  }
};
