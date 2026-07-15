import { SettingsCategory } from 'shared-types';

// Used as the Mongoose schema's `category` enum array, matching the
// USER_ROLES/ACCOUNT_STATUSES convention.
export const SETTINGS_CATEGORIES: readonly SettingsCategory[] = Object.values(
  SettingsCategory,
) as SettingsCategory[];
