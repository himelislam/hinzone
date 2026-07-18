import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { WithdrawalStatus } from 'shared-types';
import type { Withdrawal } from 'shared-types';

import { renderWithProviders, screen } from '@/test/render';

import WithdrawalTable from './WithdrawalTable';

const WITHDRAWAL: Withdrawal = {
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
  createdAt: new Date('2026-07-16T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-07-16T10:00:00Z').toISOString(),
};

// Render/pagination only - filtering lives in WithdrawalFilter, not this
// component, same boundary DepositTable.test.tsx already draws.
describe('WithdrawalTable', () => {
  it('shows a loading state', () => {
    renderWithProviders(
      <WithdrawalTable withdrawals={[]} isLoading page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('Loading withdrawals...')).toBeInTheDocument();
  });

  it('shows an empty state when there are no withdrawals', () => {
    renderWithProviders(
      <WithdrawalTable withdrawals={[]} page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('No withdrawals found.')).toBeInTheDocument();
  });

  it('renders a row per withdrawal with the formatted amount, fee, net amount, and status badge', () => {
    renderWithProviders(
      <WithdrawalTable
        withdrawals={[WITHDRAWAL]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        currencySymbol="৳"
      />,
    );

    expect(screen.getByText('WD-20260716-000001')).toBeInTheDocument();
    expect(screen.getByText('৳1,000.00')).toBeInTheDocument();
    expect(screen.getByText('৳50.00')).toBeInTheDocument();
    expect(screen.getByText('৳950.00')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('calls onRowClick with the clicked withdrawal', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();

    renderWithProviders(
      <WithdrawalTable
        withdrawals={[WITHDRAWAL]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByText('WD-20260716-000001'));

    expect(onRowClick).toHaveBeenCalledWith(WITHDRAWAL);
  });

  it('calls onPageChange with the next/previous page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderWithProviders(
      <WithdrawalTable
        withdrawals={[WITHDRAWAL]}
        page={2}
        totalPages={3}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables Previous on the first page and Next on the last page', () => {
    renderWithProviders(
      <WithdrawalTable withdrawals={[WITHDRAWAL]} page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
