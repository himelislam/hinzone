import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { StockStatus } from 'shared-types';
import type { CurrencySettings, Stock } from 'shared-types';

import { settingsService } from '@/services/settings.service';
import { stockService } from '@/services/stock.service';
import { fireEvent, renderWithProviders, screen, waitFor, within } from '@/test/render';

import PriceUpdateForm from './PriceUpdateForm';

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

const openDialog = async (user: ReturnType<typeof userEvent.setup>): Promise<HTMLElement> => {
  await user.click(screen.getByRole('button', { name: 'Update price' }));
  return screen.findByRole('dialog', { name: 'Update price' });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockedSettingsService.getSettingsByCategory.mockResolvedValue(CURRENCY_SETTINGS);
});

describe('PriceUpdateForm', () => {
  it('previews no change when the dialog first opens at the current price', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PriceUpdateForm stock={STOCK} trigger={<button type="button">Update price</button>} />,
    );

    const dialog = await openDialog(user);

    expect(within(dialog).getByText('$150.00')).toBeInTheDocument();
    expect(within(dialog).getByText('+$0.00 (+0.00%)')).toBeInTheDocument();
    expect(within(dialog).getByText('Previous: $150.00')).toBeInTheDocument();
  });

  it('computes the live change/percentage preview using the same formula as the server', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PriceUpdateForm stock={STOCK} trigger={<button type="button">Update price</button>} />,
    );

    const dialog = await openDialog(user);
    fireEvent.change(within(dialog).getByLabelText('New price'), { target: { value: '165' } });

    // change = 165 - 150 = 15; percentageChange = (15 / 150) * 100 = 10.
    expect(within(dialog).getByText('$165.00')).toBeInTheDocument();
    expect(within(dialog).getByText('+$15.00 (+10.00%)')).toBeInTheDocument();
    expect(within(dialog).getByText('Previous: $150.00')).toBeInTheDocument();
  });

  it('previews a loss without a plus sign', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PriceUpdateForm stock={STOCK} trigger={<button type="button">Update price</button>} />,
    );

    const dialog = await openDialog(user);
    fireEvent.change(within(dialog).getByLabelText('New price'), { target: { value: '120' } });

    // change = 120 - 150 = -30; percentageChange = (-30 / 150) * 100 = -20.
    // formatCurrency prepends the symbol before toLocaleString's own sign
    // rather than moving it after the sign, so a loss reads "$-30.00", not
    // "-$30.00".
    expect(within(dialog).getByText('$120.00')).toBeInTheDocument();
    expect(within(dialog).getByText('$-30.00 (-20.00%)')).toBeInTheDocument();
  });

  it('submits the new price only after confirming in the dialog', async () => {
    const user = userEvent.setup();
    mockedStockService.adminUpdateStockPrice.mockResolvedValue({ ...STOCK, currentPrice: 165 });

    renderWithProviders(
      <PriceUpdateForm stock={STOCK} trigger={<button type="button">Update price</button>} />,
    );

    const dialog = await openDialog(user);
    fireEvent.change(within(dialog).getByLabelText('New price'), { target: { value: '165' } });
    expect(mockedStockService.adminUpdateStockPrice).not.toHaveBeenCalled();

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

    renderWithProviders(
      <PriceUpdateForm stock={STOCK} trigger={<button type="button">Update price</button>} />,
    );

    const dialog = await openDialog(user);
    fireEvent.change(within(dialog).getByLabelText('New price'), { target: { value: '165' } });
    await user.click(within(dialog).getByRole('button', { name: 'Update price' }));

    expect(await screen.findByText('Price must be a positive number.')).toBeInTheDocument();
  });
});
