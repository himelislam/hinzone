import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { TransactionCategory, TransactionStatus, TransactionType } from 'shared-types';
import type { Transaction } from 'shared-types';

import { renderWithProviders, screen } from '@/test/render';

import TransactionTable from './TransactionTable';

const TRANSACTION: Transaction = {
  id: 'txn-1',
  transactionNumber: 'TRX-20260715-000001',
  walletId: 'wallet-1',
  userId: 'user-1',
  type: TransactionType.CREDIT,
  category: TransactionCategory.DEPOSIT,
  amount: 500,
  balanceBefore: 734.5,
  balanceAfter: 1234.5,
  currency: 'BDT',
  status: TransactionStatus.COMPLETED,
  description: 'Deposit via bKash',
  createdAt: new Date('2026-07-15T10:00:00Z').toISOString(),
};

describe('TransactionTable', () => {
  it('shows a loading state', () => {
    renderWithProviders(
      <TransactionTable
        transactions={[]}
        isLoading
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  it('shows an empty state when there are no transactions', () => {
    renderWithProviders(
      <TransactionTable transactions={[]} page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.getByText('No transactions found.')).toBeInTheDocument();
  });

  it('renders a row per transaction with the formatted amount and badges', () => {
    renderWithProviders(
      <TransactionTable
        transactions={[TRANSACTION]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
        currencySymbol="৳"
      />,
    );

    expect(screen.getByText('TRX-20260715-000001')).toBeInTheDocument();
    expect(screen.getByText('৳500.00')).toBeInTheDocument();
    expect(screen.getByText('DEPOSIT')).toBeInTheDocument();
    expect(screen.getByText('CREDIT')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('Deposit via bKash')).toBeInTheDocument();
  });

  it('calls onPageChange with the next/previous page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    renderWithProviders(
      <TransactionTable
        transactions={[TRANSACTION]}
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
      <TransactionTable
        transactions={[TRANSACTION]}
        page={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
});
