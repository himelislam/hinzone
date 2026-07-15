import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SettingsCategory } from 'shared-types';
import type { StockSettings } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import StockSettingsPage from './StockSettingsPage';

vi.mock('@/services/settings.service');

const mockedSettingsService = vi.mocked(settingsService);

const STOCK: StockSettings = {
  enabled: true,
  autoSellEnabled: false,
  minimumPurchase: 1,
  maximumPurchase: 1000,
  fractionalSharesEnabled: false,
  priceUpdateMode: 'manual',
  autoSellIntervalMinutes: 60,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StockSettingsPage', () => {
  it('prefills the price update mode select with the fetched value', async () => {
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(STOCK);

    renderWithProviders(<StockSettingsPage />);

    expect(await screen.findByRole('combobox')).toHaveTextContent('Manual');
  });

  it('changes the price update mode and saves it', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(STOCK);
    mockedSettingsService.updateSettings.mockResolvedValue({
      ...STOCK,
      priceUpdateMode: 'automatic',
    });

    renderWithProviders(<StockSettingsPage />);

    await screen.findByRole('combobox');
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Automatic' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedSettingsService.updateSettings).toHaveBeenCalledWith(
        SettingsCategory.STOCKS,
        expect.objectContaining({ priceUpdateMode: 'automatic' }),
      );
    });
  });
});
