import { useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router-dom';

import StockPriceCard from '@/components/cards/StockPriceCard';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import PriceHistoryTable from '@/components/tables/PriceHistoryTable';
import { Card, CardContent } from '@/components/ui/card';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useStock, useStockHistory } from '@/hooks/useStockQueries';

// phase-07.md's Stock Details page - company info/description, StockPriceCard,
// category/industry, PriceHistoryTable, wired to useStock(id) + useStockHistory(id).
// Public, no ProtectedRoute wrapper (tasks/breakdown/phase-07-tasks.md task 52).
const StockDetailsPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const stockQuery = useStock(id ?? '');
  const [historyPage, setHistoryPage] = useState(1);
  const historyQuery = useStockHistory(id ?? '', { page: historyPage, limit: 10 });
  const currencySettingsQuery = useCurrencySettings();

  if (stockQuery.isLoading) {
    return <LoadingState message="Loading stock..." />;
  }

  if (stockQuery.isError || !stockQuery.data) {
    return (
      <ErrorState
        message="We couldn't load this stock."
        onRetry={() => void stockQuery.refetch()}
      />
    );
  }

  const stock = stockQuery.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        {stock.logoUrl ? (
          <img
            src={stock.logoUrl}
            alt={`${stock.companyName} logo`}
            className="border-border h-16 w-16 rounded-full border object-contain"
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-16 w-16 items-center justify-center rounded-full text-lg font-semibold">
            {stock.symbol.slice(0, 2)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold">{stock.companyName}</h1>
          <p className="text-muted-foreground text-sm">
            {stock.symbol} · {stock.category} · {stock.industry}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <StockPriceCard
            currentPrice={stock.currentPrice}
            previousPrice={stock.previousPrice}
            dailyChange={stock.dailyChange}
            dailyChangePercentage={stock.dailyChangePercentage}
            currencySymbol={currencySettingsQuery.data?.currencySymbol}
            decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
          />

          {/* Reserved for Phase 08's trading action - phase-07.md: "Prepare
              layout for future trading actions." Not building any trading UI
              in this phase. */}
          <div className="border-border text-muted-foreground flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm">
            Trading will be available in a future update.
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-semibold">About</h2>
        <p className="text-muted-foreground text-sm">{stock.description}</p>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Price History</h2>
        <PriceHistoryTable
          history={historyQuery.data?.data ?? []}
          isLoading={historyQuery.isLoading}
          page={historyPage}
          totalPages={historyQuery.data?.pagination.totalPages ?? 1}
          onPageChange={setHistoryPage}
          currencySymbol={currencySettingsQuery.data?.currencySymbol}
          decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        />
      </div>
    </div>
  );
};

export default StockDetailsPage;
