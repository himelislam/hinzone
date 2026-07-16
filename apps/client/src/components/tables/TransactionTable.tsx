import type { JSX } from 'react';
import type { Transaction } from 'shared-types';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import TransactionBadge from '@/components/common/TransactionBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/format-currency';

interface TransactionTableProps {
  readonly transactions: readonly Transaction[];
  readonly isLoading?: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// GET /wallet/transactions results (tasks/phase-04.md's TransactionTable columns:
// Transaction ID, Date, Category, Type, Amount, Status, Description). Loading and
// empty states reuse the shared LoadingState/EmptyState rather than
// reimplementing them (coding_rules.md #24 - check for an existing component
// before creating one). `amount` is always a positive magnitude
// (transaction.model.ts's `min: 0`) - the Type badge is what conveys direction,
// so the Amount column never needs its own +/- sign.
const TransactionTable = ({
  transactions,
  isLoading = false,
  page,
  totalPages,
  onPageChange,
  currencySymbol,
  decimalPrecision,
}: TransactionTableProps): JSX.Element => {
  if (isLoading) {
    return <LoadingState message="Loading transactions..." />;
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions found."
        description="Transactions will appear here once you deposit, withdraw, or trade."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono text-xs">{transaction.transactionNumber}</TableCell>
              <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <Badge variant="outline">{transaction.category}</Badge>
              </TableCell>
              <TableCell>
                <TransactionBadge type={transaction.type} />
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCurrency(transaction.amount, currencySymbol, decimalPrecision)}
              </TableCell>
              <TableCell>
                <TransactionBadge status={transaction.status} />
              </TableCell>
              <TableCell className="text-muted-foreground max-w-60 truncate">
                {transaction.description ?? '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;
