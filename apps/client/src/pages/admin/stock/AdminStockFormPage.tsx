import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import StockForm from '@/components/forms/StockForm';
import { useAdminStock } from '@/hooks/useStockQueries';

// Thin shell around StockForm (tasks/breakdown/phase-07-tasks.md task 50),
// mounted at both /admin/stocks/new and /admin/stocks/:id/edit - branches
// create-vs-edit on whether an :id param is present, same relationship
// DepositDashboardPage has to DepositForm except covering both verbs with
// one page component. In edit mode, the stock is fetched here (not by
// StockForm itself) so this page owns the loading/error states around the
// fetch, matching AdminStockDetailPage's own boundary.
const AdminStockFormPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const stockQuery = useAdminStock(id ?? '');

  if (isEditMode && stockQuery.isLoading) {
    return <LoadingState message="Loading stock..." />;
  }

  if (isEditMode && (stockQuery.isError || !stockQuery.data)) {
    return (
      <ErrorState
        message="We couldn't load this stock."
        onRetry={() => void stockQuery.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{isEditMode ? 'Edit Stock' : 'Create Stock'}</h1>
      <StockForm
        stock={isEditMode ? stockQuery.data : undefined}
        onSuccess={() => void navigate(isEditMode ? `/admin/stocks/${id}` : '/admin/stocks')}
      />
    </div>
  );
};

export default AdminStockFormPage;
