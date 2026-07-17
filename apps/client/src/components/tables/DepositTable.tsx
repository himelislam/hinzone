import type { JSX } from 'react';
import type { Deposit } from 'shared-types';

import DepositStatusBadge from '@/components/common/DepositStatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
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

interface DepositTableProps {
  readonly deposits: readonly Deposit[];
  readonly isLoading?: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly onRowClick?: (deposit: Deposit) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// tasks/phase-05.md's Deposit History columns: Deposit Number, Date, Amount,
// Status, Payment Method. Loading/empty states reuse the shared
// LoadingState/EmptyState (coding_rules.md #24), same structure as
// TransactionTable.
const DepositTable = ({
  deposits,
  isLoading = false,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  currencySymbol,
  decimalPrecision,
}: DepositTableProps): JSX.Element => {
  if (isLoading) {
    return <LoadingState message="Loading deposits..." />;
  }

  if (deposits.length === 0) {
    return (
      <EmptyState
        title="No deposits found."
        description="Deposit requests will appear here once one is submitted."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deposit Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deposits.map((deposit) => (
            <TableRow
              key={deposit.id}
              onClick={onRowClick ? (): void => onRowClick(deposit) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              <TableCell className="font-mono text-xs">{deposit.depositNumber}</TableCell>
              <TableCell>{new Date(deposit.createdAt).toLocaleString()}</TableCell>
              <TableCell className="tabular-nums">
                {formatCurrency(deposit.amount, currencySymbol, decimalPrecision)}
              </TableCell>
              <TableCell>{deposit.paymentMethod}</TableCell>
              <TableCell>
                <DepositStatusBadge status={deposit.status} />
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

export default DepositTable;
