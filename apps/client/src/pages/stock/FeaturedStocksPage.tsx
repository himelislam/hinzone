import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';

import FeaturedStockCard from '@/components/cards/FeaturedStockCard';
import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useFeaturedStocks } from '@/hooks/useStockQueries';

// phase-07.md's Featured Stocks public page - the curated `featured: true`
// catalog subset, reusing FeaturedStockCard (built in Section H but never
// wired to a route until now). No pagination - useFeaturedStocks() /
// StockService.getFeaturedStocks() return the full curated set with no
// page/limit params, same shape as useStockCategories(). Public, no
// ProtectedRoute wrapper - same reasoning as StockListingPage/
// StockDetailsPage (stock.routes.ts's GET /stocks/featured carries no
// `authenticate` middleware).
const FeaturedStocksPage = (): JSX.Element => {
  const featuredQuery = useFeaturedStocks();
  const currencySettingsQuery = useCurrencySettings();
  const navigate = useNavigate();

  const stocks = featuredQuery.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Featured Stocks</h1>

      {featuredQuery.isError ? (
        <ErrorState
          message="We couldn't load featured stocks."
          onRetry={() => void featuredQuery.refetch()}
        />
      ) : featuredQuery.isLoading ? (
        <LoadingState message="Loading featured stocks..." />
      ) : stocks.length === 0 ? (
        <EmptyState
          title="No featured stocks yet."
          description="Stocks marked as featured by an admin will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stocks.map((stock) => (
            <FeaturedStockCard
              key={stock.id}
              stock={stock}
              onClick={(clicked) => void navigate(`/stocks/${clicked.id}`)}
              currencySymbol={currencySettingsQuery.data?.currencySymbol}
              decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedStocksPage;
