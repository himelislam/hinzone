import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SettingsCategory } from 'shared-types';
import type { SecuritySettings } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import SecuritySettingsPage from './SecuritySettingsPage';

vi.mock('@/services/settings.service');

const mockedSettingsService = vi.mocked(settingsService);

const SECURITY: SecuritySettings = {
  jwtAccessExpiration: '15m',
  jwtRefreshExpiration: '7d',
  passwordPolicy: {
    minimumLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true,
  },
  maximumLoginAttempts: 5,
  accountLockDurationMinutes: 15,
  passwordResetTokenExpirationMinutes: 30,
  sessionTimeoutMinutes: 60,
  twoFactorEnabled: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SecuritySettingsPage', () => {
  it('prefills nested passwordPolicy fields from the fetched settings', async () => {
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(SECURITY);

    renderWithProviders(<SecuritySettingsPage />);

    expect(await screen.findByLabelText('Minimum length')).toHaveValue(8);
    expect(screen.getByLabelText('Require uppercase letter')).toBeChecked();
    expect(screen.getByLabelText('Two-factor authentication')).not.toBeChecked();
  });

  it('rejects a malformed JWT duration before ever calling the API', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(SECURITY);

    renderWithProviders(<SecuritySettingsPage />);

    const accessField = await screen.findByLabelText('Access token expiration');
    await user.clear(accessField);
    await user.type(accessField, 'soon');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(/enter a duration such as/i)).toBeInTheDocument();
    expect(mockedSettingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('edits a nested passwordPolicy field and saves it correctly', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(SECURITY);
    mockedSettingsService.updateSettings.mockResolvedValue(SECURITY);

    renderWithProviders(<SecuritySettingsPage />);

    const minLengthField = await screen.findByLabelText('Minimum length');
    await user.clear(minLengthField);
    await user.type(minLengthField, '10');
    await user.click(screen.getByLabelText('Require special character'));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedSettingsService.updateSettings).toHaveBeenCalledWith(
        SettingsCategory.SECURITY,
        expect.objectContaining({
          passwordPolicy: {
            ...SECURITY.passwordPolicy,
            minimumLength: 10,
            requireSpecialCharacters: false,
          },
        }),
      );
    });
  });
});
