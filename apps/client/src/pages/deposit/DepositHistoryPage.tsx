import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import DepositFilter from '@/components/tables/DepositFilter';
import DepositTable from '@/components/tables/DepositTable';
import ErrorState from '@/components/common/ErrorState';
import { useDeposits } from '@/hooks/useDepositQueries';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import type { DepositListParams } from '@/types/deposit.types';

const DEFAULT_PARAMS: DepositListParams = { page: 1, limit: 20 };

// tasks/phase-05.md's Deposit History page - DepositFilter + DepositTable,
// wired to useDeposits(params), same structure as TransactionHistoryPage.
const DepositHistoryPage = (): JSX.Element => {
  const [params, setParams] = useState<DepositListParams>(DEFAULT_PARAMS);
  const depositsQuery = useDeposits(params);
  const currencySettingsQuery = useCurrencySettings();
  const navigate = useNavigate();

  // A changed filter invalidates the current page - always jump back to page 1
  // rather than risk landing on a now-out-of-range page for the new result set.
  const handleFilterChange = (next: DepositListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Deposit History</h1>

      <DepositFilter value={params} onChange={handleFilterChange} />

      {depositsQuery.isError ? (
        <ErrorState
          message="We couldn't load your deposits."
          onRetry={() => void depositsQuery.refetch()}
        />
      ) : (
        <DepositTable
          deposits={depositsQuery.data?.data ?? []}
          isLoading={depositsQuery.isLoading}
          page={params.page ?? 1}
          totalPages={depositsQuery.data?.pagination.totalPages ?? 1}
          onPageChange={handlePageChange}
          onRowClick={(deposit) => void navigate(`/deposits/${deposit.id}`)}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      )}
    </div>
  );
};

export default DepositHistoryPage;
