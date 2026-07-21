import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { StockStatus } from 'shared-types';
import type { CurrencySettings, PaginatedResponse, Stock } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { stockService } from '@/services/stock.service';
import { renderWithProviders, screen } from '@/test/render';

import StockListingPage from './StockListingPage';

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

const stocksPage = (
  stocks: Stock[],
  overrides?: Partial<PaginatedResponse<Stock>['pagination']>,
): PaginatedResponse<Stock> => ({
  success: true,
  data: stocks,
  pagination: { page: 1, limit: 20, total: stocks.length, totalPages: 1, ...overrides },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
  mockedStockService.getStockCategories.mockResolvedValue(['Technology']);
});

describe('StockListingPage', () => {
  it('renders a card for each stock in the public catalog', async () => {
    mockedStockService.getStocks.mockResolvedValue(stocksPage([STOCK]));

    renderWithProviders(<StockListingPage />);

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL · Technology')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('does not show any admin-only filters or actions', async () => {
    mockedStockService.getStocks.mockResolvedValue(stocksPage([STOCK]));

    renderWithProviders(<StockListingPage />);

    await screen.findByText('Apple Inc.');
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Featured')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create Stock' })).not.toBeInTheDocument();
  });

  it('shows an empty state when there are no stocks', async () => {
    mockedStockService.getStocks.mockResolvedValue(stocksPage([]));

    renderWithProviders(<StockListingPage />);

    expect(await screen.findByText('No stocks found.')).toBeInTheDocument();
  });

  it('shows an error state when the catalog fails to load', async () => {
    mockedStockService.getStocks.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<StockListingPage />);

    expect(await screen.findByText("We couldn't load stocks.")).toBeInTheDocument();
  });

  it('navigates to the stock details page when a card is clicked', async () => {
    const user = userEvent.setup();
    mockedStockService.getStocks.mockResolvedValue(stocksPage([STOCK]));

    renderWithProviders(
      <Routes>
        <Route path="/stocks" element={<StockListingPage />} />
        <Route path="/stocks/:id" element={<div>Stock details for stock-1</div>} />
      </Routes>,
      { initialEntries: ['/stocks'] },
    );

    await user.click(await screen.findByText('Apple Inc.'));

    expect(await screen.findByText('Stock details for stock-1')).toBeInTheDocument();
  });

  it('paginates using Previous/Next', async () => {
    const user = userEvent.setup();
    mockedStockService.getStocks.mockResolvedValue(stocksPage([STOCK], { page: 1, totalPages: 2 }));

    renderWithProviders(<StockListingPage />);

    await screen.findByText('Apple Inc.');
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(mockedStockService.getStocks).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });
});
