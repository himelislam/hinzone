import type { SettingsCategory } from 'shared-types';

// Relative to VITE_API_URL - see auth-endpoints.constants.ts for the same
// convention. BY_CATEGORY/ADMIN_UPDATE are derived from the category value itself
// rather than a 10-entry lookup map, since SettingsCategory's enum values already
// are the exact route segments (docs/20-settings-system.md #21) - matching
// apps/server's own SettingsCategory-keyed route/schema maps.
export const SETTINGS_ENDPOINTS = {
  ALL: '/settings',
  BY_CATEGORY: (category: SettingsCategory): string => `/settings/${category}`,
  ADMIN_UPDATE: (category: SettingsCategory): string => `/admin/settings/${category}`,
} as const;
