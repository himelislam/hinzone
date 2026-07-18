import type { JSX } from 'react';
import { Search } from 'lucide-react';
import { WithdrawalStatus } from 'shared-types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WithdrawalListParams, WithdrawalSortBy } from '@/types/withdrawal.types';

// Radix Select cannot use an empty string as an item value, so "no filter
// selected" is represented by this sentinel and mapped back to undefined here
// rather than leaking into WithdrawalListParams - same convention as
// DepositFilter/TransactionFilter.
const ALL = 'all';

const SORT_OPTIONS: ReadonlyArray<{ value: WithdrawalSortBy; label: string }> = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highestAmount', label: 'Highest amount' },
  { value: 'lowestAmount', label: 'Lowest amount' },
];

interface WithdrawalFilterProps {
  readonly value: WithdrawalListParams;
  readonly onChange: (value: WithdrawalListParams) => void;
  // Settings-driven (useWithdrawalSettings()), never hardcoded - optional
  // since the user history page's own withdrawals rarely need filtering by
  // method, unlike the admin withdrawals page which always has the list on
  // hand, same reasoning as DepositFilter's paymentMethods prop.
  readonly paymentMethods?: readonly string[];
  // tasks/phase-06.md's Search & Filtering "User" field - an exact-userId
  // filter, admin-only (the server ignores this field entirely on the
  // user-facing GET /withdrawals endpoint, so there is no point rendering it
  // on WithdrawalHistoryPage). Off by default, same gating style as the
  // paymentMethods prop above.
  readonly showUserIdFilter?: boolean;
}

// Filter controls for GET /withdrawals and GET /admin/withdrawals (both
// share withdrawalListQuerySchema) - purely controlled, same pattern as
// DepositFilter: the parent page owns the actual WithdrawalListParams state
// and re-fetches via useWithdrawals(params)/useAdminWithdrawals(params) on
// change.
const WithdrawalFilter = ({
  value,
  onChange,
  paymentMethods,
  showUserIdFilter,
}: WithdrawalFilterProps): JSX.Element => {
  const update = (patch: Partial<WithdrawalListParams>): void => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="withdrawal-filter-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="withdrawal-filter-search"
            type="text"
            placeholder="Search by withdrawal number"
            value={value.search ?? ''}
            onChange={(event) => update({ search: event.target.value || undefined })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="withdrawal-filter-date-from">From</Label>
        <Input
          id="withdrawal-filter-date-from"
          type="date"
          value={value.dateFrom ?? ''}
          onChange={(event) => update({ dateFrom: event.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="withdrawal-filter-date-to">To</Label>
        <Input
          id="withdrawal-filter-date-to"
          type="date"
          value={value.dateTo ?? ''}
          onChange={(event) => update({ dateTo: event.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="withdrawal-filter-min-amount">Min amount</Label>
        <Input
          id="withdrawal-filter-min-amount"
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
        <Label htmlFor="withdrawal-filter-max-amount">Max amount</Label>
        <Input
          id="withdrawal-filter-max-amount"
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
        <Label htmlFor="withdrawal-filter-status">Status</Label>
        <Select
          value={value.status ?? ALL}
          onValueChange={(next) =>
            update({ status: next === ALL ? undefined : (next as WithdrawalStatus) })
          }
        >
          <SelectTrigger id="withdrawal-filter-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(WithdrawalStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paymentMethods && paymentMethods.length > 0 ? (
        <div className="space-y-1.5">
          <Label htmlFor="withdrawal-filter-payment-method">Payment method</Label>
          <Select
            value={value.paymentMethod ?? ALL}
            onValueChange={(next) => update({ paymentMethod: next === ALL ? undefined : next })}
          >
            <SelectTrigger id="withdrawal-filter-payment-method" className="w-full">
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

      {showUserIdFilter ? (
        <div className="space-y-1.5">
          <Label htmlFor="withdrawal-filter-user-id">User ID</Label>
          <Input
            id="withdrawal-filter-user-id"
            type="text"
            placeholder="Exact user ID"
            value={value.userId ?? ''}
            onChange={(event) => update({ userId: event.target.value || undefined })}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="withdrawal-filter-sort">Sort by</Label>
        <Select
          value={value.sortBy ?? 'latest'}
          onValueChange={(next) => update({ sortBy: next as WithdrawalSortBy })}
        >
          <SelectTrigger id="withdrawal-filter-sort" className="w-full">
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

export default WithdrawalFilter;
