import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { StockStatus } from 'shared-types';
import type { CurrencySettings, Stock } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { stockService } from '@/services/stock.service';
import { renderWithProviders, screen } from '@/test/render';

import FeaturedStocksPage from './FeaturedStocksPage';

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

const FEATURED_STOCK: Stock = {
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
  featured: true,
  displayOrder: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
});

describe('FeaturedStocksPage', () => {
  it('renders a card for each featured stock', async () => {
    mockedStockService.getFeaturedStocks.mockResolvedValue([FEATURED_STOCK]);

    renderWithProviders(<FeaturedStocksPage />);

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('AAPL · Technology')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('shows an empty state when there are no featured stocks', async () => {
    mockedStockService.getFeaturedStocks.mockResolvedValue([]);

    renderWithProviders(<FeaturedStocksPage />);

    expect(await screen.findByText('No featured stocks yet.')).toBeInTheDocument();
  });

  it('shows an error state when featured stocks fail to load', async () => {
    mockedStockService.getFeaturedStocks.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<FeaturedStocksPage />);

    expect(await screen.findByText("We couldn't load featured stocks.")).toBeInTheDocument();
  });

  it('navigates to the stock details page when a card is clicked', async () => {
    const user = userEvent.setup();
    mockedStockService.getFeaturedStocks.mockResolvedValue([FEATURED_STOCK]);

    renderWithProviders(
      <Routes>
        <Route path="/stocks/featured" element={<FeaturedStocksPage />} />
        <Route path="/stocks/:id" element={<div>Stock details for stock-1</div>} />
      </Routes>,
      { initialEntries: ['/stocks/featured'] },
    );

    await user.click(await screen.findByText('Apple Inc.'));

    expect(await screen.findByText('Stock details for stock-1')).toBeInTheDocument();
  });
});
