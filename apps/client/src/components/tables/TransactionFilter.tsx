import type { JSX } from 'react';
import { Search } from 'lucide-react';
import { TransactionCategory, TransactionStatus, TransactionType } from 'shared-types';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransactionListParams, TransactionSortBy } from '@/types/wallet.types';

interface TransactionFilterProps {
  readonly value: TransactionListParams;
  readonly onChange: (value: TransactionListParams) => void;
}

// Radix Select cannot use an empty string as an item value, so "no filter
// selected" is represented by this sentinel and mapped back to undefined here
// rather than leaking into TransactionListParams.
const ALL = 'all';

const SORT_OPTIONS: ReadonlyArray<{ value: TransactionSortBy; label: string }> = [
  { value: 'latest', label: 'Latest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highestAmount', label: 'Highest amount' },
  { value: 'lowestAmount', label: 'Lowest amount' },
];

// Filter controls for GET /wallet/transactions (tasks/phase-04.md's Transaction
// Filtering section) - purely controlled, same pattern as RankTable/PackageTable:
// the parent (Task H's Transaction History page) owns the actual
// TransactionListParams state and re-fetches via useTransactions(params) on change.
const TransactionFilter = ({ value, onChange }: TransactionFilterProps): JSX.Element => {
  const update = (patch: Partial<TransactionListParams>): void => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
        <Label htmlFor="transaction-filter-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="transaction-filter-search"
            type="text"
            placeholder="Search by transaction number or description"
            value={value.search ?? ''}
            onChange={(event) => update({ search: event.target.value || undefined })}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transaction-filter-date-from">From</Label>
        <Input
          id="transaction-filter-date-from"
          type="date"
          value={value.dateFrom ?? ''}
          onChange={(event) => update({ dateFrom: event.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transaction-filter-date-to">To</Label>
        <Input
          id="transaction-filter-date-to"
          type="date"
          value={value.dateTo ?? ''}
          onChange={(event) => update({ dateTo: event.target.value || undefined })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transaction-filter-min-amount">Min amount</Label>
        <Input
          id="transaction-filter-min-amount"
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
        <Label htmlFor="transaction-filter-max-amount">Max amount</Label>
        <Input
          id="transaction-filter-max-amount"
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
        <Label htmlFor="transaction-filter-type">Type</Label>
        <Select
          value={value.type ?? ALL}
          onValueChange={(next) =>
            update({ type: next === ALL ? undefined : (next as TransactionType) })
          }
        >
          <SelectTrigger id="transaction-filter-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {Object.values(TransactionType).map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transaction-filter-category">Category</Label>
        <Select
          value={value.category ?? ALL}
          onValueChange={(next) =>
            update({ category: next === ALL ? undefined : (next as TransactionCategory) })
          }
        >
          <SelectTrigger id="transaction-filter-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {Object.values(TransactionCategory).map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transaction-filter-status">Status</Label>
        <Select
          value={value.status ?? ALL}
          onValueChange={(next) =>
            update({ status: next === ALL ? undefined : (next as TransactionStatus) })
          }
        >
          <SelectTrigger id="transaction-filter-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {Object.values(TransactionStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="transaction-filter-sort">Sort by</Label>
        <Select
          value={value.sortBy ?? 'latest'}
          onValueChange={(next) => update({ sortBy: next as TransactionSortBy })}
        >
          <SelectTrigger id="transaction-filter-sort" className="w-full">
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

export default TransactionFilter;
