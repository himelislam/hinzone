import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { StockStatus } from 'shared-types';
import type { Stock } from 'shared-types';

import { renderWithProviders, screen } from '@/test/render';

import StockTable from './StockTable';

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
  createdAt: new Date('2026-07-16T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-07-16T10:00:00Z').toISOString(),
};

describe('StockTable', () => {
  it('shows a loading state', () => {
    renderWithProviders(
      <StockTable stocks={[]} isLoading page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('Loading stocks...')).toBeInTheDocument();
  });

  it('shows an empty state when there are no stocks', () => {
    renderWithProviders(<StockTable stocks={[]} page={1} totalPages={1} onPageChange={vi.fn()} />);

    expect(screen.getByText('No stocks found.')).toBeInTheDocument();
  });

  it('renders a row per stock with the formatted price, daily change, and status', () => {
    renderWithProviders(
      <StockTable
        stocks={[STOCK]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        currencySymbol="$"
      />,
    );

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('+3.45%')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('shows a losing daily change without a plus sign', () => {
    renderWithProviders(
      <StockTable
        stocks={[{ ...STOCK, dailyChange: -5, dailyChangePercentage: -3.45 }]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('-3.45%')).toBeInTheDocument();
  });

  it('calls onRowClick with the clicked stock', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    renderWithProviders(
      <StockTable
        stocks={[STOCK]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByText('AAPL'));

    expect(onRowClick).toHaveBeenCalledWith(STOCK);
  });

  it('calls onPageChange with the next/previous page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderWithProviders(
      <StockTable stocks={[STOCK]} page={2} totalPages={3} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on the first page and Next on the last page', () => {
    renderWithProviders(
      <StockTable stocks={[STOCK]} page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
