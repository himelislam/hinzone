import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { DepositStatus } from 'shared-types';

import DepositFilter from '@/components/tables/DepositFilter';
import DepositTable from '@/components/tables/DepositTable';
import ErrorState from '@/components/common/ErrorState';
import { useAdminDeposits } from '@/hooks/useDepositQueries';
import { useCurrencySettings, useDepositSettings } from '@/hooks/useSettingsQueries';
import type { DepositListParams } from '@/types/deposit.types';

// tasks/phase-05.md's Admin Pending Deposits (task 39) and Deposit History
// (task 40) are the same underlying list+filters view over
// GET /admin/deposits, which already supports every filter task 40 asks for
// (status, paymentMethod, date range, amount, search) - defaulting the status
// filter to PENDING gives admins their actionable queue on arrival, exactly
// task 39's "table of PENDING deposits", while clearing that one filter turns
// the identical page into the full cross-user history browser task 40 asks
// for. One page/route serves both rather than duplicating the list UI twice.
// (Task 40's "user" filter isn't included - depositListQuerySchema has no
// userId filter param to wire it to.) Approve/Reject actions live on the
// detail page (AdminDepositDetailPage), reached by clicking a row.
const DEFAULT_PARAMS: DepositListParams = { page: 1, limit: 20, status: DepositStatus.PENDING };

const AdminDepositsPage = (): JSX.Element => {
  const [params, setParams] = useState<DepositListParams>(DEFAULT_PARAMS);
  const depositsQuery = useAdminDeposits(params);
  const currencySettingsQuery = useCurrencySettings();
  const depositSettingsQuery = useDepositSettings();
  const navigate = useNavigate();

  const handleFilterChange = (next: DepositListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Deposits</h1>

      <DepositFilter
        value={params}
        onChange={handleFilterChange}
        paymentMethods={depositSettingsQuery.data?.paymentMethods}
      />

      {depositsQuery.isError ? (
        <ErrorState
          message="We couldn't load deposits."
          onRetry={() => void depositsQuery.refetch()}
        />
      ) : (
        <DepositTable
          deposits={depositsQuery.data?.data ?? []}
          isLoading={depositsQuery.isLoading}
          page={params.page ?? 1}
          totalPages={depositsQuery.data?.pagination.totalPages ?? 1}
          onPageChange={handlePageChange}
          onRowClick={(deposit) => void navigate(`/admin/deposits/${deposit.id}`)}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      )}
    </div>
  );
};

export default AdminDepositsPage;
