import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DepositStatus, SettingsCategory } from 'shared-types';
import type { CurrencySettings, Deposit, DepositSettings } from 'shared-types';

import { depositService } from '@/services/deposit.service';
import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import DepositForm from './DepositForm';

vi.mock('@/services/deposit.service');
vi.mock('@/services/settings.service');

const mockedDepositService = vi.mocked(depositService);
const mockedSettingsService = vi.mocked(settingsService);

const DEPOSIT_SETTINGS: DepositSettings = {
  enabled: true,
  packages: [{ amount: 3000 }, { amount: 6000 }],
  minimumDeposit: 3000,
  maximumDeposit: 100000,
  paymentMethods: ['bKash', 'Nagad'],
  companyBkashNumber: '01711111111',
  companyNagadNumber: '01722222222',
  depositInstructions: 'Send the exact package amount and keep the receipt.',
};

const CURRENCY_SETTINGS: CurrencySettings = {
  defaultCurrency: 'BDT',
  currencySymbol: '৳',
  usdToBdtRate: 120,
  bdtToUsdRate: 0.00833,
  decimalPrecision: 2,
};

const DEPOSIT_RESULT: Deposit = {
  id: 'dep-1',
  depositNumber: 'DEP-20260716-000001',
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 3000,
  currency: 'BDT',
  paymentMethod: 'bKash',
  senderAccountNumber: '01712345678',
  paymentReference: 'TXN123456',
  screenshotUrl: 'https://res.cloudinary.com/test/screenshot.jpg',
  status: DepositStatus.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const buildScreenshot = (): File =>
  new File([new Uint8Array(1024)], 'screenshot.jpg', { type: 'image/jpeg' });

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(await screen.findByRole('combobox', { name: 'Deposit package' }));
  await user.click(await screen.findByRole('option', { name: /3,000/ }));

  await user.click(screen.getByRole('combobox', { name: 'Pay via' }));
  await user.click(await screen.findByRole('option', { name: 'bKash' }));

  await user.type(screen.getByLabelText('Sender account number'), '01712345678');
  await user.type(screen.getByLabelText('Payment reference'), 'TXN123456');
  await user.upload(screen.getByLabelText('Payment screenshot'), buildScreenshot());
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockImplementation((category) => {
    if (category === SettingsCategory.DEPOSIT) {
      return Promise.resolve(DEPOSIT_SETTINGS);
    }

    if (category === SettingsCategory.CURRENCY) {
      return Promise.resolve(CURRENCY_SETTINGS);
    }

    throw new Error(`Unexpected settings category requested in test: ${category}`);
  });
});

describe('DepositForm', () => {
  it('renders the admin-configured packages, payment methods, and instructions dynamically', async () => {
    renderWithProviders(<DepositForm />);

    await screen.findByRole('combobox', { name: 'Deposit package' });
    expect(
      screen.getByText('Send the exact package amount and keep the receipt.'),
    ).toBeInTheDocument();
  });

  it('blocks submission and shows a validation message when no screenshot is attached', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DepositForm />);

    await user.click(await screen.findByRole('combobox', { name: 'Deposit package' }));
    await user.click(await screen.findByRole('option', { name: /3,000/ }));
    await user.click(screen.getByRole('combobox', { name: 'Pay via' }));
    await user.click(await screen.findByRole('option', { name: 'bKash' }));
    await user.type(screen.getByLabelText('Sender account number'), '01712345678');
    await user.type(screen.getByLabelText('Payment reference'), 'TXN123456');

    await user.click(screen.getByRole('button', { name: 'Submit deposit request' }));

    expect(await screen.findByText('A payment screenshot is required.')).toBeInTheDocument();
    expect(mockedDepositService.createDeposit).not.toHaveBeenCalled();
  });

  it('submits the selected package/payment method/screenshot as a CreateDepositPayload', async () => {
    const user = userEvent.setup();
    mockedDepositService.createDeposit.mockResolvedValue(DEPOSIT_RESULT);

    renderWithProviders(<DepositForm />);
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Submit deposit request' }));

    await waitFor(() => {
      expect(mockedDepositService.createDeposit).toHaveBeenCalled();
    });

    // Asserted separately from the object shape below rather than via
    // expect.any(File) inside objectContaining - vitest types expect.any()'s
    // return as `any`, which trips @typescript-eslint/no-unsafe-assignment.
    const [payload] = mockedDepositService.createDeposit.mock.calls[0] ?? [];
    expect(payload).toMatchObject({
      packageAmount: 3000,
      paymentMethod: 'bKash',
      senderAccountNumber: '01712345678',
      paymentReference: 'TXN123456',
    });
    expect(payload?.screenshot).toBeInstanceOf(File);

    expect(await screen.findByText('Deposit request submitted successfully.')).toBeInTheDocument();
  });

  it('shows the server error message when submission fails', async () => {
    const user = userEvent.setup();
    mockedDepositService.createDeposit.mockRejectedValue(
      new Error('Selected deposit package is not available.'),
    );

    renderWithProviders(<DepositForm />);
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Submit deposit request' }));

    expect(
      await screen.findByText('Selected deposit package is not available.'),
    ).toBeInTheDocument();
  });
});
