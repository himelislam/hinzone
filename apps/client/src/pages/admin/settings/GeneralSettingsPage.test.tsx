import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SettingsCategory } from 'shared-types';
import type { GeneralSettings } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import GeneralSettingsPage from './GeneralSettingsPage';

vi.mock('@/services/settings.service');

const mockedSettingsService = vi.mocked(settingsService);

const GENERAL: GeneralSettings = {
  platformName: 'Acme',
  platformEmail: 'info@acme.test',
  supportEmail: 'support@acme.test',
  supportPhone: '+8801000000000',
  maintenanceMode: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GeneralSettingsPage', () => {
  it('shows a loading state while the category is being fetched', () => {
    mockedSettingsService.getSettingsByCategory.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<GeneralSettingsPage />);

    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
  });

  it('shows an error state with a retry option when the fetch fails', async () => {
    mockedSettingsService.getSettingsByCategory.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<GeneralSettingsPage />);

    expect(await screen.findByText("We couldn't load these settings.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('prefills the form with the fetched settings', async () => {
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(GENERAL);

    renderWithProviders(<GeneralSettingsPage />);

    expect(await screen.findByLabelText('Platform name')).toHaveValue('Acme');
    expect(screen.getByLabelText('Platform email')).toHaveValue('info@acme.test');
    expect(screen.getByLabelText('Maintenance mode')).not.toBeChecked();
  });

  it('blocks submission and shows an inline error for an invalid email', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(GENERAL);

    renderWithProviders(<GeneralSettingsPage />);

    const emailField = await screen.findByLabelText('Platform email');
    await user.clear(emailField);
    await user.type(emailField, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(mockedSettingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('saves a valid edit and shows a success message', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(GENERAL);
    mockedSettingsService.updateSettings.mockResolvedValue({
      ...GENERAL,
      platformName: 'New Name',
    });

    renderWithProviders(<GeneralSettingsPage />);

    const nameField = await screen.findByLabelText('Platform name');
    await user.clear(nameField);
    await user.type(nameField, 'New Name');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedSettingsService.updateSettings).toHaveBeenCalledWith(
        SettingsCategory.GENERAL,
        expect.objectContaining({ platformName: 'New Name' }),
      );
    });
    expect(await screen.findByText('General settings updated successfully.')).toBeInTheDocument();
  });

  it('shows the server error message when the save fails', async () => {
    const user = userEvent.setup();
    mockedSettingsService.getSettingsByCategory.mockResolvedValue(GENERAL);
    mockedSettingsService.updateSettings.mockRejectedValue(new Error('Server exploded.'));

    renderWithProviders(<GeneralSettingsPage />);

    await screen.findByLabelText('Platform name');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Server exploded.')).toBeInTheDocument();
  });
});
