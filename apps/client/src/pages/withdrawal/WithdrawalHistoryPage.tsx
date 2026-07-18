import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorState from '@/components/common/ErrorState';
import WithdrawalFilter from '@/components/tables/WithdrawalFilter';
import WithdrawalTable from '@/components/tables/WithdrawalTable';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useWithdrawals } from '@/hooks/useWithdrawalQueries';
import type { WithdrawalListParams } from '@/types/withdrawal.types';

const DEFAULT_PARAMS: WithdrawalListParams = { page: 1, limit: 20 };

// WithdrawalFilter + WithdrawalTable, wired to useWithdrawals(params), same
// structure as DepositHistoryPage.
const WithdrawalHistoryPage = (): JSX.Element => {
  const [params, setParams] = useState<WithdrawalListParams>(DEFAULT_PARAMS);
  const withdrawalsQuery = useWithdrawals(params);
  const currencySettingsQuery = useCurrencySettings();
  const navigate = useNavigate();

  // A changed filter invalidates the current page - always jump back to page 1
  // rather than risk landing on a now-out-of-range page for the new result set.
  const handleFilterChange = (next: WithdrawalListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Withdrawal History</h1>

      <WithdrawalFilter value={params} onChange={handleFilterChange} />

      {withdrawalsQuery.isError ? (
        <ErrorState
          message="We couldn't load your withdrawals."
          onRetry={() => void withdrawalsQuery.refetch()}
        />
      ) : (
        <WithdrawalTable
          withdrawals={withdrawalsQuery.data?.data ?? []}
          isLoading={withdrawalsQuery.isLoading}
          page={params.page ?? 1}
          totalPages={withdrawalsQuery.data?.pagination.totalPages ?? 1}
          onPageChange={handlePageChange}
          onRowClick={(withdrawal) => void navigate(`/withdrawals/${withdrawal.id}`)}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      )}
    </div>
  );
};

export default WithdrawalHistoryPage;
