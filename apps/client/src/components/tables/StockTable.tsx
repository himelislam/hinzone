import type { JSX } from 'react';
import type { Stock } from 'shared-types';

import EmptyState from '@/components/common/EmptyState';
import LoadingState from '@/components/common/LoadingState';
import StockStatusBadge from '@/components/common/StockStatusBadge';
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

interface StockTableProps {
  readonly stocks: readonly Stock[];
  readonly isLoading?: boolean;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
  readonly onRowClick?: (stock: Stock) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// phase-07.md's Stock Listing columns: Logo, Symbol, Company, Category,
// Price, Daily Change, Status. Loading/empty states reuse the shared
// LoadingState/EmptyState (coding_rules.md #24), same structure as
// DepositTable/WithdrawalTable. Used by the admin stock list.
const StockTable = ({
  stocks,
  isLoading = false,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  currencySymbol,
  decimalPrecision,
}: StockTableProps): JSX.Element => {
  if (isLoading) {
    return <LoadingState message="Loading stocks..." />;
  }

  if (stocks.length === 0) {
    return (
      <EmptyState
        title="No stocks found."
        description="Stocks will appear here once one is added to the catalog."
      />
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Logo</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Daily Change</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => {
            const isGain = stock.dailyChange >= 0;

            return (
              <TableRow
                key={stock.id}
                onClick={onRowClick ? (): void => onRowClick(stock) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                <TableCell>
                  {stock.logoUrl ? (
                    <img
                      src={stock.logoUrl}
                      alt={`${stock.companyName} logo`}
                      className="border-border h-8 w-8 rounded-full border object-contain"
                    />
                  ) : (
                    <div className="bg-muted text-muted-foreground flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold">
                      {stock.symbol.slice(0, 2)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{stock.symbol}</TableCell>
                <TableCell>{stock.companyName}</TableCell>
                <TableCell>{stock.category}</TableCell>
                <TableCell className="tabular-nums">
                  {formatCurrency(stock.currentPrice, currencySymbol, decimalPrecision)}
                </TableCell>
                <TableCell
                  className={cn('tabular-nums', isGain ? 'text-success' : 'text-destructive')}
                >
                  {isGain ? '+' : ''}
                  {stock.dailyChangePercentage.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <StockStatusBadge status={stock.status} />
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

export default StockTable;
