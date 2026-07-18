import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { SettingsCategory, WithdrawalStatus } from 'shared-types';
import type { CurrencySettings, Withdrawal, WithdrawalSettings } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { withdrawalService } from '@/services/withdrawal.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import WithdrawalForm from './WithdrawalForm';

vi.mock('@/services/withdrawal.service');
vi.mock('@/services/settings.service');

const mockedWithdrawalService = vi.mocked(withdrawalService);
const mockedSettingsService = vi.mocked(settingsService);

const WITHDRAWAL_SETTINGS: WithdrawalSettings = {
  enabled: true,
  minimumWithdrawal: 1000,
  maximumWithdrawal: 100000,
  waitingPeriodDays: 15,
  withdrawalFeePercentage: 5,
  processingTimeHours: 24,
  paymentMethods: ['bKash', 'Nagad'],
};

const CURRENCY_SETTINGS: CurrencySettings = {
  defaultCurrency: 'BDT',
  currencySymbol: '৳',
  usdToBdtRate: 120,
  bdtToUsdRate: 0.00833,
  decimalPrecision: 2,
};

const WITHDRAWAL_RESULT: Withdrawal = {
  id: 'wd-1',
  withdrawalNumber: 'WD-20260716-000001',
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 2000,
  withdrawalFee: 100,
  netAmount: 1900,
  currency: 'BDT',
  paymentMethod: 'bKash',
  receiverAccountNumber: '01712345678',
  accountHolderName: 'Test User',
  status: WithdrawalStatus.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  const amountField = await screen.findByLabelText('Amount');
  await user.clear(amountField);
  await user.type(amountField, '2000');

  await user.click(screen.getByRole('combobox', { name: 'Payment method' }));
  await user.click(await screen.findByRole('option', { name: 'bKash' }));

  await user.type(screen.getByLabelText('Receiver account number'), '01712345678');
  await user.type(screen.getByLabelText('Account holder name'), 'Test User');
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockImplementation((category) => {
    if (category === SettingsCategory.WITHDRAWAL) {
      return Promise.resolve(WITHDRAWAL_SETTINGS);
    }

    if (category === SettingsCategory.CURRENCY) {
      return Promise.resolve(CURRENCY_SETTINGS);
    }

    throw new Error(`Unexpected settings category requested in test: ${category}`);
  });
});

describe('WithdrawalForm', () => {
  it('renders the admin-configured limits, fee, processing time, and waiting period dynamically', async () => {
    renderWithProviders(<WithdrawalForm />);

    const paragraph = await screen.findByText(/Withdraw between/);
    expect(paragraph).toHaveTextContent(
      'Withdraw between ৳1,000.00 and ৳100,000.00. A 5% fee applies, and processing takes up to 24 hours after approval. Withdrawals are only available 15 days after your first approved deposit.',
    );
  });

  it('live-updates the fee/net amount preview as the amount changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WithdrawalForm />);

    const amountField = await screen.findByLabelText('Amount');
    await user.clear(amountField);
    await user.type(amountField, '2000');

    expect(await screen.findByText('৳100.00')).toBeInTheDocument();
    expect(await screen.findByText('৳1,900.00')).toBeInTheDocument();
  });

  it('blocks submission and shows a validation message for an amount of zero', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WithdrawalForm />);

    await screen.findByLabelText('Amount');
    await user.click(screen.getByRole('combobox', { name: 'Payment method' }));
    await user.click(await screen.findByRole('option', { name: 'bKash' }));
    await user.type(screen.getByLabelText('Receiver account number'), '01712345678');
    await user.type(screen.getByLabelText('Account holder name'), 'Test User');

    await user.click(screen.getByRole('button', { name: 'Submit withdrawal request' }));

    expect(await screen.findByText('Amount must be greater than zero.')).toBeInTheDocument();
    expect(mockedWithdrawalService.createWithdrawal).not.toHaveBeenCalled();
  });

  it('submits the entered amount/payment method/receiver details as a CreateWithdrawalPayload', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.createWithdrawal.mockResolvedValue(WITHDRAWAL_RESULT);

    renderWithProviders(<WithdrawalForm />);
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Submit withdrawal request' }));

    await waitFor(() => {
      // TanStack Query calls mutationFn with a second (mutation context)
      // argument - see DepositForm.test.tsx/AdminDepositDetailPage.test.tsx
      // for the same reasoning.
      expect(mockedWithdrawalService.createWithdrawal).toHaveBeenCalledWith(
        {
          amount: 2000,
          paymentMethod: 'bKash',
          receiverAccountNumber: '01712345678',
          accountHolderName: 'Test User',
        },
        expect.anything(),
      );
    });

    expect(
      await screen.findByText('Withdrawal request submitted successfully.'),
    ).toBeInTheDocument();
  });

  it('shows the server error message when submission fails', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.createWithdrawal.mockRejectedValue(
      new Error('Insufficient wallet balance for this withdrawal.'),
    );

    renderWithProviders(<WithdrawalForm />);
    await fillRequiredFields(user);

    await user.click(screen.getByRole('button', { name: 'Submit withdrawal request' }));

    expect(
      await screen.findByText('Insufficient wallet balance for this withdrawal.'),
    ).toBeInTheDocument();
  });
});
