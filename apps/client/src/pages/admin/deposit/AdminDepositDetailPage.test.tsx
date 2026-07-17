import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { AccountStatus, DepositStatus, UserRole } from 'shared-types';
import type { CurrencySettings, Deposit, User } from 'shared-types';

import { useAuth } from '@/hooks/useAuth';
import { depositService } from '@/services/deposit.service';
import { settingsService } from '@/services/settings.service';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';

import AdminDepositDetailPage from './AdminDepositDetailPage';

vi.mock('@/services/deposit.service');
vi.mock('@/services/settings.service');
// useAdminDeposit/useApproveDeposit/useRejectDeposit (hooks/useDepositQueries.ts,
// hooks/useDepositMutations.ts) are gated by `enabled: isAuthenticated` - see
// WalletDashboardPage.test.tsx for why useAuth is mocked directly rather than
// simulating a real login. Role isn't checked client-side here (AdminRoute's
// guard isn't exercised since the page is rendered directly), only
// isAuthenticated matters for these hooks.
vi.mock('@/hooks/useAuth');

const mockedDepositService = vi.mocked(depositService);
const mockedSettingsService = vi.mocked(settingsService);
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

const PENDING_DEPOSIT: Deposit = {
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

// AdminDepositDetailPage reads the deposit id via useParams(), which only
// resolves inside a matching <Route> - renderWithProviders' MemoryRouter
// wraps whatever `ui` is passed, so the route structure is provided here.
const renderPage = (): ReturnType<typeof renderWithProviders> =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/deposits/:id" element={<AdminDepositDetailPage />} />
    </Routes>,
    { initialEntries: ['/admin/deposits/dep-1'] },
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
  mockedUseAuth.mockReturnValue({
    user: ADMIN_USER,
    isAuthenticated: true,
    isLoading: false,
    setAuthenticatedUser: vi.fn(),
    clearAuth: vi.fn(),
  });
  mockedDepositService.adminGetDepositById.mockResolvedValue(PENDING_DEPOSIT);
});

describe('AdminDepositDetailPage', () => {
  it('renders the deposit details', async () => {
    renderPage();

    expect(await screen.findByText('Deposit DEP-20260716-000001')).toBeInTheDocument();
    expect(screen.getByText('bKash')).toBeInTheDocument();
    expect(screen.getByText('TXN123456')).toBeInTheDocument();
  });

  it('shows an error state when the deposit fails to load', async () => {
    mockedDepositService.adminGetDepositById.mockRejectedValue(new Error('Network error'));

    renderPage();

    expect(await screen.findByText("We couldn't load this deposit.")).toBeInTheDocument();
  });

  it('approves the deposit only after confirming in the dialog', async () => {
    const user = userEvent.setup();
    mockedDepositService.adminApproveDeposit.mockResolvedValue({
      ...PENDING_DEPOSIT,
      status: DepositStatus.APPROVED,
    });

    renderPage();
    await screen.findByText('Deposit DEP-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    // Opening the dialog must not call the mutation by itself.
    expect(mockedDepositService.adminApproveDeposit).not.toHaveBeenCalled();

    const dialog = await screen.findByRole('dialog', { name: 'Approve this deposit?' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      // TanStack Query calls mutationFn with a second (mutation context)
      // argument - see DepositForm.test.tsx for the same reasoning.
      expect(mockedDepositService.adminApproveDeposit).toHaveBeenCalledWith(
        'dep-1',
        expect.anything(),
      );
    });
  });

  it('shows the server error message when approval fails', async () => {
    const user = userEvent.setup();
    mockedDepositService.adminApproveDeposit.mockRejectedValue(
      new Error('This deposit has already been reviewed and can no longer be changed.'),
    );

    renderPage();
    await screen.findByText('Deposit DEP-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve this deposit?' });
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    expect(
      await screen.findByText(
        'This deposit has already been reviewed and can no longer be changed.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps the reject confirmation disabled until a reason is entered', async () => {
    const user = userEvent.setup();
    mockedDepositService.adminRejectDeposit.mockResolvedValue({
      ...PENDING_DEPOSIT,
      status: DepositStatus.REJECTED,
      rejectionReason: 'Screenshot unreadable',
    });

    renderPage();
    await screen.findByText('Deposit DEP-20260716-000001');

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reject this deposit?' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Reject' });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByLabelText('Rejection reason'), 'Screenshot unreadable');
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedDepositService.adminRejectDeposit).toHaveBeenCalledWith('dep-1', {
        rejectionReason: 'Screenshot unreadable',
      });
    });
  });
});
