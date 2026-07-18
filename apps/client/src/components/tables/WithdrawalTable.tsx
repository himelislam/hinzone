import type { JSX } from 'react';
import type { Withdrawal } from 'shared-types';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import WithdrawalStatusBadge from '@/components/common/WithdrawalStatusBadge';
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

interface WithdrawalTableProps {
  readonly withdrawals: readonly Withdrawal[];
  readonly isLoading?: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly onRowClick?: (withdrawal: Withdrawal) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// tasks/breakdown/phase-06-tasks.md task 41's columns: Withdrawal Number,
// Date, Amount, Fee, Net Amount, Status. Loading/empty states reuse the
// shared LoadingState/EmptyState (coding_rules.md #24), same structure as
// DepositTable. Filtering lives in a separate WithdrawalFilter component (a
// later task), not here - same boundary DepositTable draws.
const WithdrawalTable = ({
  withdrawals,
  isLoading = false,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  currencySymbol,
  decimalPrecision,
}: WithdrawalTableProps): JSX.Element => {
  if (isLoading) {
    return <LoadingState message="Loading withdrawals..." />;
  }

  if (withdrawals.length === 0) {
    return (
      <EmptyState
        title="No withdrawals found."
        description="Withdrawal requests will appear here once one is submitted."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Withdrawal Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Net Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {withdrawals.map((withdrawal) => (
            <TableRow
              key={withdrawal.id}
              onClick={onRowClick ? (): void => onRowClick(withdrawal) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              <TableCell className="font-mono text-xs">{withdrawal.withdrawalNumber}</TableCell>
              <TableCell>{new Date(withdrawal.createdAt).toLocaleString()}</TableCell>
              <TableCell className="tabular-nums">
                {formatCurrency(withdrawal.amount, currencySymbol, decimalPrecision)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCurrency(withdrawal.withdrawalFee, currencySymbol, decimalPrecision)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatCurrency(withdrawal.netAmount, currencySymbol, decimalPrecision)}
              </TableCell>
              <TableCell>
                <WithdrawalStatusBadge status={withdrawal.status} />
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

export default WithdrawalTable;
