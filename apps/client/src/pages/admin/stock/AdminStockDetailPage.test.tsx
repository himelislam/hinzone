import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { AccountStatus, StockStatus, UserRole } from 'shared-types';
import type { CurrencySettings, Stock, User } from 'shared-types';

import { useAuth } from '@/hooks/useAuth';
import { settingsService } from '@/services/settings.service';
import { stockService } from '@/services/stock.service';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';

import AdminStockDetailPage from './AdminStockDetailPage';

vi.mock('@/services/stock.service');
vi.mock('@/services/settings.service');
// useAdminStock/useChangeStockStatus/useDeleteStock are gated by
// `enabled: isAuthenticated` (hooks/useStockQueries.ts) - same reasoning
// AdminDepositDetailPage.test.tsx mocks useAuth directly.
vi.mock('@/hooks/useAuth');

const mockedStockService = vi.mocked(stockService);
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
  defaultCurrency: 'USD',
  currencySymbol: '$',
  usdToBdtRate: 120,
  bdtToUsdRate: 0.00833,
  decimalPrecision: 2,
};

const STOCK: Stock = {
  id: 'stock-1',
  symbol: 'AAPL',
  name: 'Apple',
  companyName: 'Apple Inc.',
  description: 'Consumer electronics maker.',
  category: 'Technology',
  industry: 'Consumer Electronics',
  currentPrice: 150,
  previousPrice: 145,
  currency: 'USD',
  dailyChange: 5,
  dailyChangePercentage: 3.45,
  totalShares: 1000,
  availableShares: 1000,
  minimumPurchase: 1,
  maximumPurchase: 100,
  allowFractionalShares: true,
  dividendEnabled: false,
  status: StockStatus.ACTIVE,
  featured: false,
  displayOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const EMPTY_HISTORY = {
  success: true as const,
  data: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
};

// AdminStockDetailPage reads the stock id via useParams() - renderWithProviders'
// MemoryRouter wraps whatever `ui` is passed, so the route structure (plus a
// destination for the post-delete navigate('/admin/stocks')) is provided here.
const renderPage = (): ReturnType<typeof renderWithProviders> =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/stocks/:id" element={<AdminStockDetailPage />} />
      <Route path="/admin/stocks" element={<div>Stocks list</div>} />
    </Routes>,
    { initialEntries: ['/admin/stocks/stock-1'] },
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
  mockedStockService.adminGetStockById.mockResolvedValue(STOCK);
  mockedStockService.getStockHistory.mockResolvedValue(EMPTY_HISTORY);
});

describe('AdminStockDetailPage', () => {
  it('renders the stock details', async () => {
    renderPage();

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Consumer electronics maker.')).toBeInTheDocument();
  });

  it('shows an error state when the stock fails to load', async () => {
    mockedStockService.adminGetStockById.mockRejectedValue(new Error('Network error'));

    renderPage();

    expect(await screen.findByText("We couldn't load this stock.")).toBeInTheDocument();
  });

  it('updates the price only after confirming in the price dialog', async () => {
    const user = userEvent.setup();
    mockedStockService.adminUpdateStockPrice.mockResolvedValue({ ...STOCK, currentPrice: 165 });

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Update price' }));
    const dialog = await screen.findByRole('dialog', { name: 'Update price' });
    expect(mockedStockService.adminUpdateStockPrice).not.toHaveBeenCalled();

    await user.clear(within(dialog).getByLabelText('New price'));
    await user.type(within(dialog).getByLabelText('New price'), '165');
    await user.click(within(dialog).getByRole('button', { name: 'Update price' }));

    await waitFor(() => {
      expect(mockedStockService.adminUpdateStockPrice).toHaveBeenCalledWith('stock-1', {
        newPrice: 165,
      });
    });
  });

  it('shows the server error message when the price update fails', async () => {
    const user = userEvent.setup();
    mockedStockService.adminUpdateStockPrice.mockRejectedValue(
      new Error('Price must be a positive number.'),
    );

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Update price' }));
    const dialog = await screen.findByRole('dialog', { name: 'Update price' });
    await user.clear(within(dialog).getByLabelText('New price'));
    await user.type(within(dialog).getByLabelText('New price'), '165');
    await user.click(within(dialog).getByRole('button', { name: 'Update price' }));

    expect(await screen.findByText('Price must be a positive number.')).toBeInTheDocument();
  });

  it('changes the status only after selecting a status and confirming', async () => {
    const user = userEvent.setup();
    mockedStockService.adminChangeStockStatus.mockResolvedValue({
      ...STOCK,
      status: StockStatus.SUSPENDED,
    });

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Change status' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change status' });
    const confirmButton = within(dialog).getByRole('button', { name: 'Change status' });
    expect(confirmButton).toBeDisabled();

    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: StockStatus.SUSPENDED }));
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockedStockService.adminChangeStockStatus).toHaveBeenCalledWith('stock-1', {
        status: StockStatus.SUSPENDED,
      });
    });
  });

  it('shows the server error message when the status change fails', async () => {
    const user = userEvent.setup();
    mockedStockService.adminChangeStockStatus.mockRejectedValue(
      new Error('This status transition is not allowed.'),
    );

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Change status' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change status' });
    await user.click(within(dialog).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: StockStatus.SUSPENDED }));
    await user.click(within(dialog).getByRole('button', { name: 'Change status' }));

    expect(await screen.findByText('This status transition is not allowed.')).toBeInTheDocument();
  });

  it('archives the stock via the Archive action', async () => {
    const user = userEvent.setup();
    mockedStockService.adminChangeStockStatus.mockResolvedValue({
      ...STOCK,
      status: StockStatus.ARCHIVED,
    });

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Archive' }));
    const dialog = await screen.findByRole('dialog', { name: 'Archive this stock?' });
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }));

    await waitFor(() => {
      expect(mockedStockService.adminChangeStockStatus).toHaveBeenCalledWith('stock-1', {
        status: StockStatus.ARCHIVED,
      });
    });
  });

  it('shows the server error message when archiving fails', async () => {
    const user = userEvent.setup();
    mockedStockService.adminChangeStockStatus.mockRejectedValue(
      new Error('This stock is already archived.'),
    );

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Archive' }));
    const dialog = await screen.findByRole('dialog', { name: 'Archive this stock?' });
    await user.click(within(dialog).getByRole('button', { name: 'Archive' }));

    expect(await screen.findByText('This stock is already archived.')).toBeInTheDocument();
  });

  it('hides the Archive action once the stock is already archived', async () => {
    mockedStockService.adminGetStockById.mockResolvedValue({
      ...STOCK,
      status: StockStatus.ARCHIVED,
    });

    renderPage();
    await screen.findByText('Apple Inc.');

    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument();
  });

  it('deletes the stock and navigates back to the list only after confirming', async () => {
    const user = userEvent.setup();
    mockedStockService.adminDeleteStock.mockResolvedValue(STOCK);

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this stock?' });
    expect(mockedStockService.adminDeleteStock).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      // useDeleteStock's mutationFn is stockService.adminDeleteStock itself
      // (not wrapped), so TanStack Query calls it with a second (mutation
      // context) argument - see DepositForm.test.tsx for the same reasoning.
      expect(mockedStockService.adminDeleteStock).toHaveBeenCalledWith(
        'stock-1',
        expect.anything(),
      );
    });
    expect(await screen.findByText('Stocks list')).toBeInTheDocument();
  });

  it('shows the server error message when deletion fails', async () => {
    const user = userEvent.setup();
    mockedStockService.adminDeleteStock.mockRejectedValue(
      new Error('This stock could not be deleted.'),
    );

    renderPage();
    await screen.findByText('Apple Inc.');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this stock?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('This stock could not be deleted.')).toBeInTheDocument();
  });
});
