import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { StockStatus } from 'shared-types';

import StockPriceCard from '@/components/cards/StockPriceCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import StockStatusBadge from '@/components/common/StockStatusBadge';
import PriceUpdateForm from '@/components/forms/PriceUpdateForm';
import PriceHistoryTable from '@/components/tables/PriceHistoryTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useChangeStockStatus, useDeleteStock } from '@/hooks/useStockMutations';
import { useAdminStock, useStockHistory } from '@/hooks/useStockQueries';
import { getErrorMessage } from '@/utils/get-error-message';

// Full detail view (tasks/breakdown/phase-07-tasks.md task 51) plus actions:
// Edit (routes to AdminStockFormPage), Update Price (PriceUpdateForm, already
// wraps its own ConfirmDialog), Change Status (a Select inside ConfirmDialog),
// Archive (ConfirmDialog, shorthand for "Change Status -> Archived" - reuses
// the same useChangeStockStatus() mutation, mirroring how
// stock-lifecycle.service.ts's changeStatus/archiveStock both funnel through
// one applyStatusChange server-side), Delete (ConfirmDialog, destructive
// styling). Covers phase-07.md's separately-named "Price Management" and
// "Stock History" pages - both folded in here rather than given their own
// routes, same page-consolidation reasoning as PriceUpdateForm folding the
// "Price Update Screen" into a dialog action.
const AdminStockDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const stockQuery = useAdminStock(id ?? '');
  const [historyPage, setHistoryPage] = useState(1);
  const historyQuery = useStockHistory(id ?? '', { page: historyPage, limit: 10 });
  const currencySettingsQuery = useCurrencySettings();
  const changeStatus = useChangeStockStatus();
  const deleteStock = useDeleteStock();
  const navigate = useNavigate();

  const [statusOpen, setStatusOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StockStatus | undefined>(undefined);

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

  const handleStatusDialogChange = (next: boolean): void => {
    setStatusOpen(next);

    if (next) {
      setPendingStatus(undefined);
      changeStatus.reset();
    }
  };

  const handleChangeStatus = (): void => {
    if (!pendingStatus) {
      return;
    }

    changeStatus.mutate(
      { id: stock.id, payload: { status: pendingStatus } },
      { onSuccess: () => setStatusOpen(false) },
    );
  };

  const handleArchive = (): void => {
    changeStatus.mutate(
      { id: stock.id, payload: { status: StockStatus.ARCHIVED } },
      { onSuccess: () => setArchiveOpen(false) },
    );
  };

  const handleDelete = (): void => {
    deleteStock.mutate(stock.id, {
      onSuccess: () => void navigate('/admin/stocks'),
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{stock.companyName}</h1>
          <StockStatusBadge status={stock.status} />
        </div>
        <Button type="button" variant="outline" onClick={() => void navigate('/admin/stocks')}>
          Back to list
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <StockPriceCard
            currentPrice={stock.currentPrice}
            previousPrice={stock.previousPrice}
            dailyChange={stock.dailyChange}
            dailyChangePercentage={stock.dailyChangePercentage}
            currencySymbol={currencySettingsQuery.data?.currencySymbol}
            decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
          />

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs">Symbol</dt>
              <dd className="text-sm">{stock.symbol}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Category</dt>
              <dd className="text-sm">{stock.category}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Industry</dt>
              <dd className="text-sm">{stock.industry}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Total / Available shares</dt>
              <dd className="text-sm">
                {stock.totalShares} / {stock.availableShares}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Purchase limits</dt>
              <dd className="text-sm">
                {stock.minimumPurchase} – {stock.maximumPurchase}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Featured</dt>
              <dd className="text-sm">{stock.featured ? 'Yes' : 'No'}</dd>
            </div>
          </dl>

          <p className="text-muted-foreground text-sm">{stock.description}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => void navigate(`/admin/stocks/${stock.id}/edit`)}
        >
          Edit
        </Button>

        <PriceUpdateForm stock={stock} trigger={<Button type="button">Update price</Button>} />

        <ConfirmDialog
          trigger={
            <Button type="button" variant="outline">
              Change status
            </Button>
          }
          title="Change status"
          description={`Set a new status for ${stock.symbol}.`}
          confirmLabel="Change status"
          onConfirm={handleChangeStatus}
          isConfirming={changeStatus.isPending}
          confirmDisabled={!pendingStatus}
          error={getErrorMessage(changeStatus.error)}
          open={statusOpen}
          onOpenChange={handleStatusDialogChange}
        >
          <Select
            value={pendingStatus ?? ''}
            onValueChange={(next) => setPendingStatus(next as StockStatus)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(StockStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ConfirmDialog>

        {stock.status !== StockStatus.ARCHIVED ? (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="outline">
                Archive
              </Button>
            }
            title="Archive this stock?"
            description="Archived stocks are hidden from the public catalog."
            confirmLabel="Archive"
            onConfirm={handleArchive}
            isConfirming={changeStatus.isPending}
            error={getErrorMessage(changeStatus.error)}
            open={archiveOpen}
            onOpenChange={setArchiveOpen}
          />
        ) : null}

        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive">
              Delete
            </Button>
          }
          title="Delete this stock?"
          description="This hides the stock from every list. This cannot be undone."
          confirmLabel="Delete"
          confirmVariant="destructive"
          onConfirm={handleDelete}
          isConfirming={deleteStock.isPending}
          error={getErrorMessage(deleteStock.error)}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
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

export default AdminStockDetailPage;
