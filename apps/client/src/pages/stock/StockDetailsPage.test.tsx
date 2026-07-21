import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { StockStatus } from 'shared-types';
import type { CurrencySettings, MarketHistory, Stock } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { stockService } from '@/services/stock.service';
import { renderWithProviders, screen } from '@/test/render';

import StockDetailsPage from './StockDetailsPage';

vi.mock('@/services/stock.service');
vi.mock('@/services/settings.service');

const mockedStockService = vi.mocked(stockService);
const mockedSettingsService = vi.mocked(settingsService);

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

const HISTORY_RECORD: MarketHistory = {
  id: 'history-1',
  stockId: 'stock-1',
  previousPrice: 145,
  newPrice: 150,
  change: 5,
  percentageChange: 3.45,
  source: 'manual',
  updatedBy: 'admin-1',
  createdAt: new Date('2026-07-18T10:00:00Z').toISOString(),
};

// StockDetailsPage reads the stock id via useParams() - renderWithProviders'
// MemoryRouter wraps whatever `ui` is passed, so a matching route is provided.
const renderPage = (): ReturnType<typeof renderWithProviders> =>
  renderWithProviders(
    <Routes>
      <Route path="/stocks/:id" element={<StockDetailsPage />} />
    </Routes>,
    { initialEntries: ['/stocks/stock-1'] },
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
  mockedStockService.getStockById.mockResolvedValue(STOCK);
  mockedStockService.getStockHistory.mockResolvedValue({
    success: true,
    data: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  });
});

describe('StockDetailsPage', () => {
  it('renders the stock details for a public visitor', async () => {
    renderPage();

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL · Technology · Consumer Electronics')).toBeInTheDocument();
    expect(screen.getByText('Consumer electronics maker.')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('Trading will be available in a future update.')).toBeInTheDocument();
  });

  it('does not show any admin-only actions', async () => {
    renderPage();

    await screen.findByText('Apple Inc.');
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update price' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change status' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('shows an error state when the stock fails to load', async () => {
    mockedStockService.getStockById.mockRejectedValue(new Error('Network error'));

    renderPage();

    expect(await screen.findByText("We couldn't load this stock.")).toBeInTheDocument();
  });

  it('renders the price history and paginates using Previous/Next', async () => {
    const user = userEvent.setup();
    mockedStockService.getStockHistory.mockResolvedValue({
      success: true,
      data: [HISTORY_RECORD],
      pagination: { page: 1, limit: 10, total: 15, totalPages: 2 },
    });

    renderPage();

    await screen.findByText('Apple Inc.');
    expect(screen.getByText('manual')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(mockedStockService.getStockHistory).toHaveBeenLastCalledWith(
      'stock-1',
      expect.objectContaining({ page: 2 }),
    );
  });

  it('shows an empty state when there is no price history yet', async () => {
    renderPage();

    expect(await screen.findByText('No price history yet.')).toBeInTheDocument();
  });
});
