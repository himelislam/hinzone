import { useState } from 'react';
import type { JSX } from 'react';
import { Download } from 'lucide-react';

import TransactionFilter from '@/components/tables/TransactionFilter';
import TransactionTable from '@/components/tables/TransactionTable';
import ErrorState from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useTransactions } from '@/hooks/useWalletQueries';
import type { TransactionListParams } from '@/types/wallet.types';

const DEFAULT_PARAMS: TransactionListParams = { page: 1, limit: 20 };

// tasks/phase-04.md's Transaction History page - assembles TransactionFilter
// (which now includes free-text search, matching transactionQuerySchema's
// `search` field) + TransactionTable, wired to useTransactions(params). Export
// stays visible but disabled, matching tasks/phase-04.md's own "Export
// (future-ready)" - there is no export endpoint yet.
const TransactionHistoryPage = (): JSX.Element => {
  const [params, setParams] = useState<TransactionListParams>(DEFAULT_PARAMS);
  const transactionsQuery = useTransactions(params);
  const currencySettingsQuery = useCurrencySettings();

  // A changed filter invalidates the current page - always jump back to page 1
  // rather than risk landing on a now-out-of-range page for the new result set.
  const handleFilterChange = (next: TransactionListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transaction History</h1>
        <Button type="button" variant="outline" disabled>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <TransactionFilter value={params} onChange={handleFilterChange} />

      {transactionsQuery.isError ? (
        <ErrorState
          message="We couldn't load your transactions."
          onRetry={() => void transactionsQuery.refetch()}
        />
      ) : (
        <TransactionTable
          transactions={transactionsQuery.data?.data ?? []}
          isLoading={transactionsQuery.isLoading}
          page={params.page ?? 1}
          totalPages={transactionsQuery.data?.pagination.totalPages ?? 1}
          onPageChange={handlePageChange}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      )}
    </div>
  );
};

export default TransactionHistoryPage;
