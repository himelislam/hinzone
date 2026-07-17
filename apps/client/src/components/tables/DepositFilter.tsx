import type { JSX } from 'react';
import { Search } from 'lucide-react';
import { DepositStatus } from 'shared-types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DepositListParams, DepositSortBy } from '@/types/deposit.types';

// Radix Select cannot use an empty string as an item value, so "no filter
// selected" is represented by this sentinel and mapped back to undefined here
// rather than leaking into DepositListParams - same convention as
// TransactionFilter.
const ALL = 'all';

const SORT_OPTIONS: ReadonlyArray<{ value: DepositSortBy; label: string }> = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highestAmount', label: 'Highest amount' },
  { value: 'lowestAmount', label: 'Lowest amount' },
];

interface DepositFilterProps {
  readonly value: DepositListParams;
  readonly onChange: (value: DepositListParams) => void;
  // Settings-driven (useDepositSettings()), never hardcoded - optional since
  // the user history page's own deposits rarely need filtering by method,
  // unlike the admin deposits page which always has the list on hand.
  readonly paymentMethods?: readonly string[];
}

// Filter controls for GET /deposits and GET /admin/deposits (both share
// depositListQuerySchema) - purely controlled, same pattern as
// TransactionFilter: the parent page owns the actual DepositListParams state
// and re-fetches via useDeposits(params)/useAdminDeposits(params) on change.
const DepositFilter = ({ value, onChange, paymentMethods }: DepositFilterProps): JSX.Element => {
  const update = (patch: Partial<DepositListParams>): void => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="deposit-filter-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="deposit-filter-search"
            type="text"
            placeholder="Search by deposit number"
            value={value.search ?? ''}
            onChange={(event) => update({ search: event.target.value || undefined })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deposit-filter-date-from">From</Label>
        <Input
          id="deposit-filter-date-from"
          type="date"
          value={value.dateFrom ?? ''}
          onChange={(event) => update({ dateFrom: event.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deposit-filter-date-to">To</Label>
        <Input
          id="deposit-filter-date-to"
          type="date"
          value={value.dateTo ?? ''}
          onChange={(event) => update({ dateTo: event.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deposit-filter-min-amount">Min amount</Label>
        <Input
          id="deposit-filter-min-amount"
          type="number"
          inputMode="decimal"
          value={value.minAmount ?? ''}
          onChange={(event) => {
            const parsed = event.target.valueAsNumber;
            update({ minAmount: Number.isNaN(parsed) ? undefined : parsed });
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deposit-filter-max-amount">Max amount</Label>
        <Input
          id="deposit-filter-max-amount"
          type="number"
          inputMode="decimal"
          value={value.maxAmount ?? ''}
          onChange={(event) => {
            const parsed = event.target.valueAsNumber;
            update({ maxAmount: Number.isNaN(parsed) ? undefined : parsed });
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deposit-filter-status">Status</Label>
        <Select
          value={value.status ?? ALL}
          onValueChange={(next) =>
            update({ status: next === ALL ? undefined : (next as DepositStatus) })
          }
        >
          <SelectTrigger id="deposit-filter-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(DepositStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paymentMethods && paymentMethods.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="deposit-filter-payment-method">Payment method</Label>
          <Select
            value={value.paymentMethod ?? ALL}
            onValueChange={(next) => update({ paymentMethod: next === ALL ? undefined : next })}
          >
            <SelectTrigger id="deposit-filter-payment-method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All methods</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="deposit-filter-sort">Sort by</Label>
        <Select
          value={value.sortBy ?? 'latest'}
          onValueChange={(next) => update({ sortBy: next as DepositSortBy })}
        >
          <SelectTrigger id="deposit-filter-sort" className="w-full">
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

export default DepositFilter;
