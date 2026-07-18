import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { AccountStatus, UserRole, WalletStatus, WithdrawalStatus } from 'shared-types';
import type { CurrencySettings, User, Wallet, Withdrawal } from 'shared-types';

import { useAuth } from '@/hooks/useAuth';
import { settingsService } from '@/services/settings.service';
import { walletService } from '@/services/wallet.service';
import { withdrawalService } from '@/services/withdrawal.service';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';

import AdminWithdrawalDetailPage from './AdminWithdrawalDetailPage';

vi.mock('@/services/withdrawal.service');
vi.mock('@/services/settings.service');
vi.mock('@/services/wallet.service');
// useAdminWithdrawal/useApprove.../useAdminWallet (hooks/useWithdrawalQueries.ts,
// hooks/useWithdrawalMutations.ts, hooks/useWalletQueries.ts) are gated by
// `enabled: isAuthenticated` - see AdminDepositDetailPage.test.tsx for why
// useAuth is mocked directly rather than simulating a real login.
vi.mock('@/hooks/useAuth');

const mockedWithdrawalService = vi.mocked(withdrawalService);
const mockedSettingsService = vi.mocked(settingsService);
const mockedWalletService = vi.mocked(walletService);
const mockedUseAuth = vi.mocked(useAuth);

const ADMIN_USER: User = {
  id: 'admin-1',
  fullName: 'Admin User',
  username: 'admin',
  phoneNumber: '01700000000',
  role: UserRole.ADMIN,
  status: AccountStatus.ACTIVE,
  referralId: 'REF900001',
  isVerified: true,
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

const WALLET: Wallet = {
  id: 'wallet-1',
  userId: 'user-1',
  availableBalance: 5000,
  pendingBalance: 0,
  totalDeposited: 10000,
  totalWithdrawn: 0,
  totalProfit: 0,
  totalInvestment: 0,
  currency: 'BDT',
  status: WalletStatus.ACTIVE,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const buildWithdrawal = (overrides: Partial<Withdrawal> = {}): Withdrawal => ({
  id: 'wd-1',
  withdrawalNumber: 'WD-20260716-000001',
  userId: 'user-1',
  walletId: 'wallet-1',
  amount: 1000,
  withdrawalFee: 50,
  netAmount: 950,
  currency: 'BDT',
  paymentMethod: 'bKash',
  receiverAccountNumber: '01712345678',
  accountHolderName: 'Test User',
  status: WithdrawalStatus.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// AdminWithdrawalDetailPage reads the withdrawal id via useParams(), which
// only resolves inside a matching <Route> - renderWithProviders' MemoryRouter
// wraps whatever `ui` is passed, so the route structure is provided here.
const renderPage = (): ReturnType<typeof renderWithProviders> =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/withdrawals/:id" element={<AdminWithdrawalDetailPage />} />
    </Routes>,
    { initialEntries: ['/admin/withdrawals/wd-1'] },
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
  mockedWalletService.adminGetWalletById.mockResolvedValue(WALLET);
  mockedUseAuth.mockReturnValue({
    user: ADMIN_USER,
    isAuthenticated: true,
    isLoading: false,
    setAuthenticatedUser: vi.fn(),
    clearAuth: vi.fn(),
  });
});

describe('AdminWithdrawalDetailPage', () => {
  it('renders the withdrawal details and wallet balance', async () => {
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(buildWithdrawal());

    renderPage();

    expect(await screen.findByText('Withdrawal WD-20260716-000001')).toBeInTheDocument();
    expect(screen.getByText('01712345678')).toBeInTheDocument();
    expect(await screen.findByText('৳5,000.00')).toBeInTheDocument();
  });

  it('shows an error state when the withdrawal fails to load', async () => {
    mockedWithdrawalService.adminGetWithdrawalById.mockRejectedValue(new Error('Network error'));

    renderPage();

    expect(await screen.findByText("We couldn't load this withdrawal.")).toBeInTheDocument();
  });

  it('only shows Approve/Reject while PENDING, Mark as processing while APPROVED, and Complete while APPROVED or PROCESSING', async () => {
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.REJECTED }),
    );

    renderPage();

    await screen.findByText('Withdrawal WD-20260716-000001');
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark as processing' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
  });

  it('approves the withdrawal only after confirming in the dialog', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(buildWithdrawal());
    mockedWithdrawalService.adminApproveWithdrawal.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.APPROVED }),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    // Opening the dialog must not call the mutation by itself.
    expect(mockedWithdrawalService.adminApproveWithdrawal).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog', { name: 'Approve this withdrawal?' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(mockedWithdrawalService.adminApproveWithdrawal).toHaveBeenCalledWith(
        'wd-1',
        expect.anything(),
      );
    });
  });

  it('shows the server error message when approval fails', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(buildWithdrawal());
    mockedWithdrawalService.adminApproveWithdrawal.mockRejectedValue(
      new Error('This withdrawal has already been reviewed and can no longer be changed.'),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve this withdrawal?' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(
      await screen.findByText(
        'This withdrawal has already been reviewed and can no longer be changed.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps the reject confirmation disabled until a reason is entered', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(buildWithdrawal());
    mockedWithdrawalService.adminRejectWithdrawal.mockResolvedValue(
      buildWithdrawal({
        status: WithdrawalStatus.REJECTED,
        rejectionReason: 'Receiver account could not be verified',
      }),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reject this withdrawal?' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Reject' });
    expect(confirmButton).toBeDisabled();

    await user.type(
      screen.getByLabelText('Rejection reason'),
      'Receiver account could not be verified',
    );
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedWithdrawalService.adminRejectWithdrawal).toHaveBeenCalledWith('wd-1', {
        rejectionReason: 'Receiver account could not be verified',
      });
    });
  });

  it('shows the server error message when rejection fails', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(buildWithdrawal());
    mockedWithdrawalService.adminRejectWithdrawal.mockRejectedValue(
      new Error('A rejection reason is required.'),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reject this withdrawal?' });
    await user.type(screen.getByLabelText('Rejection reason'), 'test reason');
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }));

    expect(await screen.findByText('A rejection reason is required.')).toBeInTheDocument();
  });

  it('moves an APPROVED withdrawal to processing only after confirming', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.APPROVED }),
    );
    mockedWithdrawalService.adminMarkProcessing.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.PROCESSING }),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Mark as processing' }));
    expect(mockedWithdrawalService.adminMarkProcessing).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog', {
      name: 'Move this withdrawal to processing?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Mark as processing' }));

    await waitFor(() => {
      expect(mockedWithdrawalService.adminMarkProcessing).toHaveBeenCalledWith(
        'wd-1',
        expect.anything(),
      );
    });
  });

  it('completes an APPROVED withdrawal only after confirming', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.APPROVED }),
    );
    mockedWithdrawalService.adminCompleteWithdrawal.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.COMPLETED }),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Complete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete this withdrawal?' });
    await user.click(within(dialog).getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(mockedWithdrawalService.adminCompleteWithdrawal).toHaveBeenCalledWith(
        'wd-1',
        expect.anything(),
      );
    });
  });

  it('shows Complete (not Mark as processing) for a PROCESSING withdrawal, and shows the server error when completion fails', async () => {
    const user = userEvent.setup();
    mockedWithdrawalService.adminGetWithdrawalById.mockResolvedValue(
      buildWithdrawal({ status: WithdrawalStatus.PROCESSING }),
    );
    mockedWithdrawalService.adminCompleteWithdrawal.mockRejectedValue(
      new Error('Insufficient wallet balance for this withdrawal.'),
    );

    renderPage();
    await screen.findByText('Withdrawal WD-20260716-000001');

    expect(screen.queryByRole('button', { name: 'Mark as processing' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete this withdrawal?' });
    await user.click(within(dialog).getByRole('button', { name: 'Complete' }));

    expect(
      await screen.findByText('Insufficient wallet balance for this withdrawal.'),
    ).toBeInTheDocument();
  });
});
