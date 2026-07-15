import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SettingsCategory } from 'shared-types';
import type { DepositSettings } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import DepositSettingsPage from './DepositSettingsPage';

vi.mock('@/services/settings.service');

const mockedSettingsService = vi.mocked(settingsService);

const DEPOSIT: DepositSettings = {
  enabled: true,
  packages: [{ amount: 3000 }],
  minimumDeposit: 3000,
  maximumDeposit: 100000,
  paymentMethods: ['bKash'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DepositSettingsPage', () => {
  it('prefills packages and payment methods from the fetched settings', async () => {
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(DEPOSIT);

    renderWithProviders(<DepositSettingsPage />);

    expect(await screen.findByLabelText('Package 1 amount')).toHaveValue(3000);
    expect(screen.getByLabelText('Payment methods (one per line)')).toHaveValue('bKash');
  });

  it('adds a package row and blocks submission until it has a positive amount', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(DEPOSIT);

    renderWithProviders(<DepositSettingsPage />);

    await screen.findByLabelText('Package 1 amount');
    await user.click(screen.getByRole('button', { name: 'Add package' }));
    expect(screen.getAllByLabelText(/package \d amount/i)).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    // The new row defaults to 0, which fails packageAmountSchema (positive) -
    // the mutation must never fire with an invalid amount still in the array.
    await waitFor(() => {
      expect(mockedSettingsService.updateSettings).not.toHaveBeenCalled();
    });
  });

  it('removes a package row', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue({
      ...DEPOSIT,
      packages: [{ amount: 3000 }, { amount: 6000 }],
    });

    renderWithProviders(<DepositSettingsPage />);

    await screen.findByLabelText('Package 2 amount');
    await user.click(screen.getByRole('button', { name: 'Remove package 1' }));

    expect(screen.getAllByLabelText(/package \d amount/i)).toHaveLength(1);
    expect(screen.getByLabelText('Package 1 amount')).toHaveValue(6000);
  });

  it('cleans blank lines out of paymentMethods only at submit time', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(DEPOSIT);
    mockedSettingsService.updateSettings.mockResolvedValue(DEPOSIT);

    renderWithProviders(<DepositSettingsPage />);

    const methodsField = await screen.findByLabelText('Payment methods (one per line)');
    await user.type(methodsField, '\nNagad\n');
    // Typing a trailing newline must not be fought/collapsed while the user is
    // still editing - the raw value (with the blank trailing line) stays visible.
    expect(methodsField).toHaveValue('bKash\nNagad\n');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedSettingsService.updateSettings).toHaveBeenCalledWith(
        SettingsCategory.DEPOSIT,
        expect.objectContaining({ paymentMethods: ['bKash', 'Nagad'] }),
      );
    });
  });
});
