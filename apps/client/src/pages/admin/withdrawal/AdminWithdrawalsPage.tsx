import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { WithdrawalStatus } from 'shared-types';

import ErrorState from '@/components/common/ErrorState';
import WithdrawalFilter from '@/components/tables/WithdrawalFilter';
import WithdrawalTable from '@/components/tables/WithdrawalTable';
import { useCurrencySettings, useWithdrawalSettings } from '@/hooks/useSettingsQueries';
import { useAdminWithdrawals } from '@/hooks/useWithdrawalQueries';
import type { WithdrawalListParams } from '@/types/withdrawal.types';

// tasks/breakdown/phase-06-tasks.md task 45 - one list+filters view over
// GET /admin/withdrawals, defaulting the status filter to PENDING so admins
// get their actionable queue on arrival, while clearing that one filter
// turns the identical page into the full cross-user history browser - same
// consolidation AdminDepositsPage already established. Approve/Reject/
// Processing/Complete actions live on the detail page
// (AdminWithdrawalDetailPage), reached by clicking a row.
const DEFAULT_PARAMS: WithdrawalListParams = {
  page: 1,
  limit: 20,
  status: WithdrawalStatus.PENDING,
};

const AdminWithdrawalsPage = (): JSX.Element => {
  const [params, setParams] = useState<WithdrawalListParams>(DEFAULT_PARAMS);
  const withdrawalsQuery = useAdminWithdrawals(params);
  const currencySettingsQuery = useCurrencySettings();
  const withdrawalSettingsQuery = useWithdrawalSettings();
  const navigate = useNavigate();

  const handleFilterChange = (next: WithdrawalListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Withdrawals</h1>

      <WithdrawalFilter
        value={params}
        onChange={handleFilterChange}
        paymentMethods={withdrawalSettingsQuery.data?.paymentMethods}
        showUserIdFilter
      />

      {withdrawalsQuery.isError ? (
        <ErrorState
          message="We couldn't load withdrawals."
          onRetry={() => void withdrawalsQuery.refetch()}
        />
      ) : (
        <WithdrawalTable
          withdrawals={withdrawalsQuery.data?.data ?? []}
          isLoading={withdrawalsQuery.isLoading}
          page={params.page ?? 1}
          totalPages={withdrawalsQuery.data?.pagination.totalPages ?? 1}
          onPageChange={handlePageChange}
          onRowClick={(withdrawal) => void navigate(`/admin/withdrawals/${withdrawal.id}`)}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      )}
    </div>
  );
};

export default AdminWithdrawalsPage;
