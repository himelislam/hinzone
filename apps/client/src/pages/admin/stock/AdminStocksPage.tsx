import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import ErrorState from '@/components/common/ErrorState';
import StockFilter from '@/components/tables/StockFilter';
import StockTable from '@/components/tables/StockTable';
import { Button } from '@/components/ui/button';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useAdminStocks, useStockCategories } from '@/hooks/useStockQueries';
import type { AdminStockListParams } from '@/types/stock.types';

const DEFAULT_PARAMS: AdminStockListParams = { page: 1, limit: 20 };

// Covers phase-07.md's separately-named "Stock Dashboard" (this page) and
// "Stock Categories" page - category browsing is just StockFilter's category
// dropdown, sourced from useStockCategories() (tasks/breakdown/phase-07-tasks.md
// task 22's decision: categories aren't a separately managed entity, so no
// dedicated category-management page exists). Create/edit/status/price/
// archive/delete actions all live on the form page (task 50) or detail page
// (task 51), reached by clicking a row or the Create Stock button.
const AdminStocksPage = (): JSX.Element => {
  const [params, setParams] = useState<AdminStockListParams>(DEFAULT_PARAMS);
  const stocksQuery = useAdminStocks(params);
  const categoriesQuery = useStockCategories();
  const currencySettingsQuery = useCurrencySettings();
  const navigate = useNavigate();

  const handleFilterChange = (next: AdminStockListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stocks</h1>
        <Button type="button" onClick={() => void navigate('/admin/stocks/new')}>
          Create Stock
        </Button>
      </div>

      <StockFilter
        value={params}
        onChange={handleFilterChange}
        categories={categoriesQuery.data}
        isAdmin
      />

      {stocksQuery.isError ? (
        <ErrorState message="We couldn't load stocks." onRetry={() => void stocksQuery.refetch()} />
      ) : (
        <StockTable
          stocks={stocksQuery.data?.data ?? []}
          isLoading={stocksQuery.isLoading}
          page={params.page ?? 1}
          totalPages={stocksQuery.data?.pagination.totalPages ?? 1}
          onPageChange={handlePageChange}
          onRowClick={(stock) => void navigate(`/admin/stocks/${stock.id}`)}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      )}
    </div>
  );
};

export default AdminStocksPage;
