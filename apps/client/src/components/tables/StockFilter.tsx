import type { JSX } from 'react';
import { Search } from 'lucide-react';
import { StockStatus } from 'shared-types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AdminStockListParams, StockSortBy } from '@/types/stock.types';

// Radix Select cannot use an empty string as an item value, so "no filter
// selected" is represented by this sentinel and mapped back to undefined here
// rather than leaking into StockListParams - same convention as
// DepositFilter/WithdrawalFilter.
const ALL = 'all';

const SORT_OPTIONS: ReadonlyArray<{ value: StockSortBy; label: string }> = [
  { value: 'recentlyUpdated', label: 'Recently updated' },
  { value: 'nameAsc', label: 'Name (A-Z)' },
  { value: 'nameDesc', label: 'Name (Z-A)' },
  { value: 'symbolAsc', label: 'Symbol (A-Z)' },
  { value: 'symbolDesc', label: 'Symbol (Z-A)' },
  { value: 'priceHighToLow', label: 'Price (high to low)' },
  { value: 'priceLowToHigh', label: 'Price (low to high)' },
  { value: 'dailyGainDesc', label: 'Daily gain' },
  { value: 'dailyLossDesc', label: 'Daily loss' },
];

interface StockFilterProps {
  // Typed as the admin superset throughout - a plain StockListParams object
  // already structurally satisfies it (both interfaces are all-optional), so
  // the public Stock Listing page can pass/receive the same shape without
  // ever populating status/featured (apps/server/src/modules/stock/stock.validation.ts's
  // stockListQuerySchema/adminStockListQuerySchema mirrors this same split).
  readonly value: AdminStockListParams;
  readonly onChange: (value: AdminStockListParams) => void;
  // Resolved by the caller via useStockCategories() - optional since not
  // every page needing this filter has it on hand yet, same pattern as
  // WithdrawalFilter's paymentMethods prop.
  readonly categories?: readonly string[];
  // Gates the status/featured filters, which only have an effect against
  // GET /admin/stocks (adminStockListQuerySchema) - the public GET /stocks
  // endpoint ignores both entirely (stockListQuerySchema has no such
  // fields), same gating style as WithdrawalFilter's showUserIdFilter.
  readonly isAdmin?: boolean;
}

// Filter controls for GET /stocks and GET /admin/stocks - purely controlled,
// same pattern as DepositFilter/WithdrawalFilter: the parent page owns the
// actual params state and re-fetches via useStocks(params)/useAdminStocks(params)
// on change. Consolidates phase-07.md's separately-listed CategoryFilter/
// StockSearch components into one bar (tasks/breakdown/phase-07-tasks.md
// task 44's decision).
const StockFilter = ({ value, onChange, categories, isAdmin }: StockFilterProps): JSX.Element => {
  const update = (patch: Partial<AdminStockListParams>): void => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="stock-filter-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="stock-filter-search"
            type="text"
            placeholder="Search by symbol, name, or company"
            value={value.search ?? ''}
            onChange={(event) => update({ search: event.target.value || undefined })}
            className="pl-9"
          />
        </div>
      </div>

      {categories && categories.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="stock-filter-category">Category</Label>
          <Select
            value={value.category ?? ALL}
            onValueChange={(next) => update({ category: next === ALL ? undefined : next })}
          >
            <SelectTrigger id="stock-filter-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="stock-filter-industry">Industry</Label>
        <Input
          id="stock-filter-industry"
          type="text"
          placeholder="e.g. Software"
          value={value.industry ?? ''}
          onChange={(event) => update({ industry: event.target.value || undefined })}
        />
      </div>

      {isAdmin ? (
        <div className="space-y-1.5">
          <Label htmlFor="stock-filter-status">Status</Label>
          <Select
            value={value.status ?? ALL}
            onValueChange={(next) =>
              update({ status: next === ALL ? undefined : (next as StockStatus) })
            }
          >
            <SelectTrigger id="stock-filter-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {Object.values(StockStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {isAdmin ? (
        <div className="space-y-1.5">
          <Label htmlFor="stock-filter-featured">Featured</Label>
          <Select
            value={value.featured === undefined ? ALL : String(value.featured)}
            onValueChange={(next) =>
              update({ featured: next === ALL ? undefined : next === 'true' })
            }
          >
            <SelectTrigger id="stock-filter-featured" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All stocks</SelectItem>
              <SelectItem value="true">Featured only</SelectItem>
              <SelectItem value="false">Not featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="stock-filter-sort">Sort by</Label>
        <Select
          value={value.sortBy ?? 'recentlyUpdated'}
          onValueChange={(next) => update({ sortBy: next as StockSortBy })}
        >
          <SelectTrigger id="stock-filter-sort" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default StockFilter;
