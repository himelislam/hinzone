import { SettingsCategory } from 'shared-types';

import { seedSettings } from '@/database/seed/seed-settings';
import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { settingsRepository } from '@/modules/settings/settings.repository';
import { connectTestDatabase, disconnectTestDatabase } from '@/test/db';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);

describe('seedSettings', () => {
  it('inserts the default document for every category', async () => {
    // connectTestDatabase() already seeds once per file (Task H) - re-running here
    // is itself an idempotency check, not just setup.
    await seedSettings();

    for (const category of Object.values(SettingsCategory)) {
      const document = await settingsRepository.findByCategory(category);
      expect(document?.data).toEqual(SETTINGS_DEFAULTS[category]);
      expect(document?.updatedBy).toBeNull();
    }
  });

  it('does not overwrite a category an admin has already customized', async () => {
    const customized = {
      ...SETTINGS_DEFAULTS[SettingsCategory.CURRENCY],
      usdToBdtRate: 999,
    };
    await settingsRepository.upsertByCategory(SettingsCategory.CURRENCY, customized);

    await seedSettings();

    const document = await settingsRepository.findByCategory(SettingsCategory.CURRENCY);
    expect(document?.data).toEqual(customized);
  });
});
