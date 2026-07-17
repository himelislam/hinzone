import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DepositStatus } from 'shared-types';
import type { Deposit } from 'shared-types';

import { renderWithProviders, screen } from '@/test/render';

import DepositTable from './DepositTable';

const DEPOSIT: Deposit = {
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
  createdAt: new Date('2026-07-16T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-07-16T10:00:00Z').toISOString(),
};

describe('DepositTable', () => {
  it('shows a loading state', () => {
    renderWithProviders(
      <DepositTable deposits={[]} isLoading page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('Loading deposits...')).toBeInTheDocument();
  });

  it('shows an empty state when there are no deposits', () => {
    renderWithProviders(
      <DepositTable deposits={[]} page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('No deposits found.')).toBeInTheDocument();
  });

  it('renders a row per deposit with the formatted amount and status badge', () => {
    renderWithProviders(
      <DepositTable
        deposits={[DEPOSIT]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        currencySymbol="৳"
      />,
    );

    expect(screen.getByText('DEP-20260716-000001')).toBeInTheDocument();
    expect(screen.getByText('৳3,000.00')).toBeInTheDocument();
    expect(screen.getByText('bKash')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('calls onRowClick with the clicked deposit', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    renderWithProviders(
      <DepositTable
        deposits={[DEPOSIT]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByText('DEP-20260716-000001'));

    expect(onRowClick).toHaveBeenCalledWith(DEPOSIT);
  });

  it('calls onPageChange with the next/previous page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderWithProviders(
      <DepositTable deposits={[DEPOSIT]} page={2} totalPages={3} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on the first page and Next on the last page', () => {
    renderWithProviders(
      <DepositTable deposits={[DEPOSIT]} page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
