import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import StockCard from '@/components/cards/StockCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import StockFilter from '@/components/tables/StockFilter';
import { Button } from '@/components/ui/button';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useStockCategories, useStocks } from '@/hooks/useStockQueries';
import type { AdminStockListParams } from '@/types/stock.types';

const DEFAULT_PARAMS: AdminStockListParams = { page: 1, limit: 20 };

// phase-07.md's Stock Listing page - StockFilter + a StockCard grid (docs/17's
// listing-density convention for catalog pages: a grid of cards for a public
// browsing page, unlike the admin list's dense StockTable), wired to
// useStocks(params). Public, no ProtectedRoute wrapper
// (tasks/breakdown/phase-07-tasks.md task 52) - same reasoning
// stock.routes.ts carries no `authenticate` middleware server-side, so an
// anonymous visitor can browse the catalog.
const StockListingPage = (): JSX.Element => {
  const [params, setParams] = useState<AdminStockListParams>(DEFAULT_PARAMS);
  const stocksQuery = useStocks(params);
  const categoriesQuery = useStockCategories();
  const currencySettingsQuery = useCurrencySettings();
  const navigate = useNavigate();

  // A changed filter invalidates the current page - always jump back to page 1
  // rather than risk landing on a now-out-of-range page for the new result set.
  const handleFilterChange = (next: AdminStockListParams): void => {
    setParams({ ...next, page: 1 });
  };

  const handlePageChange = (page: number): void => {
    setParams((current) => ({ ...current, page }));
  };

  const stocks = stocksQuery.data?.data ?? [];
  const totalPages = stocksQuery.data?.pagination.totalPages ?? 1;
  const page = params.page ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Stocks</h1>

      <StockFilter value={params} onChange={handleFilterChange} categories={categoriesQuery.data} />

      {stocksQuery.isError ? (
        <ErrorState message="We couldn't load stocks." onRetry={() => void stocksQuery.refetch()} />
      ) : stocksQuery.isLoading ? (
        <LoadingState message="Loading stocks..." />
      ) : stocks.length === 0 ? (
        <EmptyState title="No stocks found." description="Try adjusting your filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stocks.map((stock) => (
              <StockCard
                key={stock.id}
                stock={stock}
                onClick={(clicked) => void navigate(`/stocks/${clicked.id}`)}
                currencySymbol={currencySettingsQuery.data?.currencySymbol}
                decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Page {page} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StockListingPage;
