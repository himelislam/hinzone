import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole, WalletStatus } from 'shared-types';
import type { CurrencySettings, User, Wallet, WalletSummary } from 'shared-types';

import { useAuth } from '@/hooks/useAuth';
import { settingsService } from '@/services/settings.service';
import { walletService } from '@/services/wallet.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import WalletDashboardPage from './WalletDashboardPage';

vi.mock('@/services/wallet.service');
vi.mock('@/services/settings.service');
// useWallet/useWalletSummary (hooks/useWalletQueries.ts) are gated by
// `enabled: isAuthenticated`, same as useCurrentUser - mocking useAuth directly
// (rather than simulating a real token-storage + AuthProvider bootstrap) matches
// routes/route-guards.test.tsx's established pattern for this exact situation.
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

const WALLET: Wallet = {
  id: 'wallet-1',
  userId: 'user-1',
  availableBalance: 1234.5,
  pendingBalance: 10,
  totalDeposited: 5000,
  totalWithdrawn: 200,
  totalProfit: 300,
  totalInvestment: 4000,
  currency: 'BDT',
  status: WalletStatus.ACTIVE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SUMMARY: WalletSummary = {
  availableBalance: 1234.5,
  pendingBalance: 10,
  totalDeposited: 5000,
  totalWithdrawn: 200,
  totalInvestment: 4000,
  totalProfit: 300,
};

const CURRENCY_SETTINGS: CurrencySettings = {
  defaultCurrency: 'BDT',
  currencySymbol: '৳',
  usdToBdtRate: 120,
  bdtToUsdRate: 0.00833,
  decimalPrecision: 2,
};

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

describe('WalletDashboardPage', () => {
  it('shows a loading state before the wallet resolves', () => {
    mockedWalletService.getWallet.mockReturnValue(new Promise(() => {}));
    mockedWalletService.getWalletSummary.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<WalletDashboardPage />);

    expect(screen.getByText('Loading your wallet...')).toBeInTheDocument();
  });

  it('renders the wallet card and summary once both queries resolve', async () => {
    mockedWalletService.getWallet.mockResolvedValue(WALLET);
    mockedWalletService.getWalletSummary.mockResolvedValue(SUMMARY);

    renderWithProviders(<WalletDashboardPage />);

    expect(await screen.findByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getAllByText('৳1,234.50').length).toBeGreaterThan(0);
    expect(screen.getByText('Available balance')).toBeInTheDocument();
    expect(screen.getByText('Total profit')).toBeInTheDocument();
  });

  it('shows an error state and retries when the wallet fails to load', async () => {
    mockedWalletService.getWallet.mockRejectedValue(new Error('Network error'));
    mockedWalletService.getWalletSummary.mockResolvedValue(SUMMARY);

    renderWithProviders(<WalletDashboardPage />);

    expect(await screen.findByText("We couldn't load your wallet.")).toBeInTheDocument();

    mockedWalletService.getWallet.mockResolvedValue(WALLET);
    screen.getByRole('button', { name: 'Retry' }).click();

    await waitFor(() => {
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });
});
