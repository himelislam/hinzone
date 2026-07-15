import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { SettingsCategory, SettingsDataByCategory } from 'shared-types';

import { settingsService } from '@/services/settings.service';

import { SETTINGS_QUERY_KEYS } from './useSettingsQueries';

// A discriminated union (rather than a generic hook parameter) so mutate({category,
// data}) still gets `data` checked against the right category's shape at the call
// site, e.g. category: SettingsCategory.GENERAL narrows data to GeneralSettings.
type UpdateSettingsVariables = {
  [C in SettingsCategory]: { category: C; data: SettingsDataByCategory[C] };
}[SettingsCategory];

// One generic mutation for all 10 admin PUT routes (phase-03.md's useUpdateSettings())
// - the settings form for a given category already knows which one it's submitting,
// so it passes the category explicitly rather than needing 10 near-identical hooks.
export const useUpdateSettings = (): UseMutationResult<
  SettingsDataByCategory[SettingsCategory],
  Error,
  UpdateSettingsVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ category, data }: UpdateSettingsVariables) =>
      settingsService.updateSettings(category, data),
    // docs/20-settings-system.md #24: refresh immediately, no refetch-and-wait -
    // the per-category cache is written directly from the response, and the
    // aggregate useSettings() query is invalidated so it picks up the change too.
    onSuccess: async (updated, { category }) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEYS.category(category), updated);
      await queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.all });
    },
  });
};
