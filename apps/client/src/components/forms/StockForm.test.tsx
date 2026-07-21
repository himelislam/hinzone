import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { StockStatus } from 'shared-types';
import type { Stock } from 'shared-types';

import { stockService } from '@/services/stock.service';
import { renderWithProviders, screen, waitFor } from '@/test/render';

import StockForm from './StockForm';

vi.mock('@/services/stock.service');

const mockedStockService = vi.mocked(stockService);

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

const CREATED_STOCK: Stock = { ...STOCK, id: 'stock-2' };

const fillRequiredFields = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.type(screen.getByLabelText('Symbol'), 'TSLA');
  await user.type(screen.getByLabelText('Company name'), 'Tesla Inc.');
  await user.type(screen.getByLabelText('Stock name'), 'Tesla');
  await user.type(screen.getByLabelText('Description'), 'Electric vehicle manufacturer.');
  await user.type(screen.getByLabelText('Category'), 'Automotive');
  await user.type(screen.getByLabelText('Industry'), 'Electric Vehicles');
  // Total shares defaults to 0, which now fails stockFormSchema's
  // `.positive()` check - every submission test must set a real value.
  await user.clear(screen.getByLabelText('Total shares'));
  await user.type(screen.getByLabelText('Total shares'), '500');
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('StockForm', () => {
  it('shows the Current price field only when creating a new stock', () => {
    renderWithProviders(<StockForm />);
    expect(screen.getByLabelText('Current price')).toBeInTheDocument();
  });

  it('hides the Current price field when editing an existing stock', () => {
    renderWithProviders(<StockForm stock={STOCK} />);
    expect(screen.queryByLabelText('Current price')).not.toBeInTheDocument();
  });

  it('requires a positive current price before creating a stock', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockForm />);

    await fillRequiredFields(user);
    // Clearing (rather than leaving the default 0) drives the field to
    // `undefined`, which passes amountSchema's own `.optional()` check and
    // lets StockForm's own manual "price required in create mode" check run -
    // a value of 0 would instead fail amountSchema.positive() first.
    await user.clear(screen.getByLabelText('Current price'));
    await user.click(screen.getByRole('button', { name: 'Create stock' }));

    expect(await screen.findByText('Current price is required.')).toBeInTheDocument();
    expect(mockedStockService.adminCreateStock).not.toHaveBeenCalled();
  });

  it('requires a positive total shares count before creating a stock', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StockForm />);

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText('Current price'), '250');
    // Total shares' own onChange maps a cleared field to 0 (unlike Current
    // price, which maps to undefined) - 0 now fails stockFormSchema's
    // `.positive()` check directly, with no separate manual check needed.
    await user.clear(screen.getByLabelText('Total shares'));
    await user.click(screen.getByRole('button', { name: 'Create stock' }));

    expect(await screen.findByText('Total shares must be greater than zero.')).toBeInTheDocument();
    expect(mockedStockService.adminCreateStock).not.toHaveBeenCalled();
  });

  it('submits a CreateStockPayload and calls onSuccess when creating a stock', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockedStockService.adminCreateStock.mockResolvedValue(CREATED_STOCK);

    renderWithProviders(<StockForm onSuccess={onSuccess} />);
    await fillRequiredFields(user);
    await user.type(screen.getByLabelText('Current price'), '250');

    await user.click(screen.getByRole('button', { name: 'Create stock' }));

    await waitFor(() => {
      expect(mockedStockService.adminCreateStock).toHaveBeenCalled();
    });

    const [payload] = mockedStockService.adminCreateStock.mock.calls[0] ?? [];
    expect(payload).toMatchObject({
      symbol: 'TSLA',
      name: 'Tesla',
      companyName: 'Tesla Inc.',
      description: 'Electric vehicle manufacturer.',
      category: 'Automotive',
      industry: 'Electric Vehicles',
      currentPrice: 250,
      totalShares: 500,
      dividendEnabled: false,
      featured: false,
      displayOrder: 0,
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('includes the uploaded logo file in the create payload', async () => {
    const user = userEvent.setup();
    mockedStockService.adminCreateStock.mockResolvedValue(CREATED_STOCK);
    const logo = new File([new Uint8Array(1024)], 'logo.png', { type: 'image/png' });

    renderWithProviders(<StockForm />);
    await fillRequiredFields(user);
    await user.type(screen.getByLabelText('Current price'), '250');
    await user.upload(screen.getByLabelText('Stock logo'), logo);

    await user.click(screen.getByRole('button', { name: 'Create stock' }));

    await waitFor(() => {
      expect(mockedStockService.adminCreateStock).toHaveBeenCalled();
    });

    const [payload] = mockedStockService.adminCreateStock.mock.calls[0] ?? [];
    expect(payload?.logo).toBeInstanceOf(File);
  });

  it('submits an UpdateStockPayload without currentPrice when editing a stock', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    mockedStockService.adminUpdateStock.mockResolvedValue(STOCK);

    renderWithProviders(<StockForm stock={STOCK} onSuccess={onSuccess} />);

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedStockService.adminUpdateStock).toHaveBeenCalled();
    });

    const [id, payload] = mockedStockService.adminUpdateStock.mock.calls[0] ?? [];
    expect(id).toBe(STOCK.id);
    expect(payload).toMatchObject({
      symbol: STOCK.symbol,
      companyName: STOCK.companyName,
      totalShares: STOCK.totalShares,
    });
    expect(payload).not.toHaveProperty('currentPrice');

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('shows the server error message when submission fails', async () => {
    const user = userEvent.setup();
    mockedStockService.adminCreateStock.mockRejectedValue(
      new Error('A stock with this symbol already exists.'),
    );

    renderWithProviders(<StockForm />);
    await fillRequiredFields(user);
    await user.type(screen.getByLabelText('Current price'), '250');

    await user.click(screen.getByRole('button', { name: 'Create stock' }));

    expect(await screen.findByText('A stock with this symbol already exists.')).toBeInTheDocument();
  });
});
