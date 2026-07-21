import type { JSX } from 'react';
import type { MarketHistory } from 'shared-types';

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
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format-currency';

interface PriceHistoryTableProps {
  readonly history: readonly MarketHistory[];
  readonly isLoading?: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// phase-07.md's Stock Price History columns: Date, Previous Price, New
// Price, Change, % Change, Source, Updated By. No admin-only fields present
// (tasks/breakdown/phase-07-tasks.md task 22's reasoning), so one component
// reused by both the public stock details page and the admin stock detail
// page's history view.
const PriceHistoryTable = ({
  history,
  isLoading = false,
  page,
  totalPages,
  onPageChange,
  currencySymbol,
  decimalPrecision,
}: PriceHistoryTableProps): JSX.Element => {
  if (isLoading) {
    return <LoadingState message="Loading price history..." />;
  }

  if (history.length === 0) {
    return (
      <EmptyState
        title="No price history yet."
        description="Price changes will appear here once an admin updates this stock's price."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Previous Price</TableHead>
            <TableHead>New Price</TableHead>
            <TableHead>Change</TableHead>
            <TableHead>% Change</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Updated By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((record) => {
            const isGain = record.change >= 0;

            return (
              <TableRow key={record.id}>
                <TableCell>{new Date(record.createdAt).toLocaleString()}</TableCell>
                <TableCell className="tabular-nums">
                  {formatCurrency(record.previousPrice, currencySymbol, decimalPrecision)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {formatCurrency(record.newPrice, currencySymbol, decimalPrecision)}
                </TableCell>
                <TableCell
                  className={cn('tabular-nums', isGain ? 'text-success' : 'text-destructive')}
                >
                  {isGain ? '+' : ''}
                  {formatCurrency(record.change, currencySymbol, decimalPrecision)}
                </TableCell>
                <TableCell
                  className={cn('tabular-nums', isGain ? 'text-success' : 'text-destructive')}
                >
                  {isGain ? '+' : ''}
                  {record.percentageChange.toFixed(2)}%
                </TableCell>
                <TableCell className="capitalize">{record.source}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {record.updatedBy ?? '—'}
                </TableCell>
              </TableRow>
            );
          })}
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

export default PriceHistoryTable;
