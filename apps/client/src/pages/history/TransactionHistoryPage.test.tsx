import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import {
  AccountStatus,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  UserRole,
} from 'shared-types';
import type { CurrencySettings, PaginatedResponse, Transaction, User } from 'shared-types';

import { useAuth } from '@/hooks/useAuth';
import { settingsService } from '@/services/settings.service';
import { walletService } from '@/services/wallet.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import TransactionHistoryPage from './TransactionHistoryPage';

vi.mock('@/services/wallet.service');
vi.mock('@/services/settings.service');
// useTransactions (hooks/useWalletQueries.ts) is gated by `enabled:
// isAuthenticated` - see WalletDashboardPage.test.tsx for why useAuth is mocked
// directly rather than simulating a real login.
vi.mock('@/hooks/useAuth');

const mockedWalletService = vi.mocked(walletService);
const mockedSettingsService = vi.mocked(settingsService);
const mockedUseAuth = vi.mocked(useAuth);

const AUTH_USER: User = {
  id: 'user-1',
  fullName: 'Test User',
  username: 'testuser',
  phoneNumber: '01712345678',
  role: UserRole.USER,
  status: AccountStatus.ACTIVE,
  referralId: 'REF100001',
  isVerified: false,
  loginAttempts: 0,
  accountLockedUntil: null,
  joinDate: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const CURRENCY_SETTINGS: CurrencySettings = {
  defaultCurrency: 'BDT',
  currencySymbol: '৳',
  usdToBdtRate: 120,
  bdtToUsdRate: 0.00833,
  decimalPrecision: 2,
};

const buildTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'txn-1',
  transactionNumber: 'TRX-20260715-000001',
  walletId: 'wallet-1',
  userId: 'user-1',
  type: TransactionType.CREDIT,
  category: TransactionCategory.DEPOSIT,
  amount: 500,
  balanceBefore: 734.5,
  balanceAfter: 1234.5,
  currency: 'BDT',
  status: TransactionStatus.COMPLETED,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const buildPage = (
  transactions: Transaction[],
  totalPages = 1,
): PaginatedResponse<Transaction> => ({
  success: true,
  data: transactions,
  pagination: { page: 1, limit: 20, total: transactions.length, totalPages },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
  mockedUseAuth.mockReturnValue({
    user: AUTH_USER,
    isAuthenticated: true,
    isLoading: false,
    setAuthenticatedUser: vi.fn(),
    clearAuth: vi.fn(),
  });
});

describe('TransactionHistoryPage', () => {
  it('renders the fetched transactions', async () => {
    mockedWalletService.getTransactions.mockResolvedValue(buildPage([buildTransaction()]));

    renderWithProviders(<TransactionHistoryPage />);

    expect(await screen.findByText('TRX-20260715-000001')).toBeInTheDocument();
    expect(mockedWalletService.getTransactions).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('shows an error state when the request fails', async () => {
    mockedWalletService.getTransactions.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<TransactionHistoryPage />);

    expect(await screen.findByText("We couldn't load your transactions.")).toBeInTheDocument();
  });

  it('re-fetches with the new filter and resets to page 1', async () => {
    const user = userEvent.setup();
    mockedWalletService.getTransactions.mockResolvedValue(buildPage([buildTransaction()], 3));

    renderWithProviders(<TransactionHistoryPage />);
    await screen.findByText('TRX-20260715-000001');

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => {
      expect(mockedWalletService.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      );
    });

    await user.click(screen.getByRole('combobox', { name: 'Type' }));
    await user.click(await screen.findByRole('option', { name: 'DEBIT' }));

    await waitFor(() => {
      expect(mockedWalletService.getTransactions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, type: 'DEBIT' }),
      );
    });
  });

  it('has the export button present but disabled', async () => {
    mockedWalletService.getTransactions.mockResolvedValue(buildPage([buildTransaction()]));

    renderWithProviders(<TransactionHistoryPage />);
    await screen.findByText('TRX-20260715-000001');

    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
  });
});
