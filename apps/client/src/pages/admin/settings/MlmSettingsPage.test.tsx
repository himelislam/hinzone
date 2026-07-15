import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SettingsCategory } from 'shared-types';
import type { MlmSettings } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import MlmSettingsPage from './MlmSettingsPage';

vi.mock('@/services/settings.service');

const mockedSettingsService = vi.mocked(settingsService);

const MLM: MlmSettings = {
  maximumDirectReferrals: 2,
  commissionLevels: [{ level: 1, rates: [{ packageAmount: 3000, commissionPercentage: 5 }] }],
  ranks: [{ name: 'Branch', directReferralsRequirement: 2, rewardPercentage: 3 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MlmSettingsPage', () => {
  it('prefills nested commission levels and ranks from the fetched settings', async () => {
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(MLM);

    renderWithProviders(<MlmSettingsPage />);

    expect(await screen.findByLabelText('Level 1 number')).toHaveValue(1);
    expect(screen.getByLabelText('Level 1 rate 1 package amount')).toHaveValue(3000);
    expect(screen.getByLabelText('Rank 1 name')).toHaveValue('Branch');
    expect(screen.getByLabelText('Rank 1 direct referrals requirement')).toHaveValue(2);
  });

  it('adds a commission level and a rate scoped to it', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(MLM);

    renderWithProviders(<MlmSettingsPage />);

    await screen.findByLabelText('Level 1 number');
    await user.click(screen.getByRole('button', { name: 'Add level' }));
    expect(screen.getAllByLabelText(/^level \d number$/i)).toHaveLength(2);

    const addRateButtons = screen.getAllByRole('button', { name: 'Add rate' });
    await user.click(addRateButtons[1]);

    expect(screen.getByLabelText('Level 2 rate 1 package amount')).toBeInTheDocument();
  });

  it('adds a rank row', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(MLM);

    renderWithProviders(<MlmSettingsPage />);

    await screen.findByLabelText('Rank 1 name');
    await user.click(screen.getByRole('button', { name: 'Add rank' }));

    expect(screen.getAllByLabelText(/rank \d name/i)).toHaveLength(2);
  });

  it('saves unmodified nested data exactly as fetched', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(MLM);
    mockedSettingsService.updateSettings.mockResolvedValue(MLM);

    renderWithProviders(<MlmSettingsPage />);

    await screen.findByLabelText('Level 1 number');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedSettingsService.updateSettings).toHaveBeenCalledWith(SettingsCategory.MLM, MLM);
    });
  });
});
