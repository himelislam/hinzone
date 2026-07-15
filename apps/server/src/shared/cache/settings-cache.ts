import type { SettingsCategory } from 'shared-types';

// In-memory only (config/cache.ts's `driver: 'memory'`) - a future Redis driver
// would sit behind this exact same get/set/has/getAll/clear surface, so nothing
// above it (settings.service.ts) would need to change. Deliberately a plain
// module-level Map rather than anything in the model/schema layer - caching is
// not a database concern (database_rules.md #7).
const cache = new Map<SettingsCategory, unknown>();

// `unknown` already covers the "not cached" case (Map#get returns undefined,
// which is a subtype of unknown) - callers check with isSettingsCategoryCached()
// or a `!== undefined` comparison, same as settings.service.ts does.
export const getCachedSettings = (category: SettingsCategory): unknown => cache.get(category);

export const getAllCachedSettings = (): ReadonlyMap<SettingsCategory, unknown> => cache;

export const setCachedSettings = (category: SettingsCategory, data: unknown): void => {
  cache.set(category, data);
};

export const isSettingsCategoryCached = (category: SettingsCategory): boolean =>
  cache.has(category);

export const clearSettingsCache = (): void => {
  cache.clear();
};
