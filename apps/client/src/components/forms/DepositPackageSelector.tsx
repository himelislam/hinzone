import type { JSX } from 'react';
import type { DepositPackage } from 'shared-types';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/utils/format-currency';

interface DepositPackageSelectorProps {
  readonly packages: readonly DepositPackage[];
  readonly value: number | undefined;
  readonly onChange: (amount: number) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// Renders the admin-configured deposit packages from Settings
// (useDepositSettings()) dynamically - project_rules.md's Settings System:
// "Deposit Packages" must never be hardcoded. Controlled, same pattern as
// TransactionFilter's Select fields.
const DepositPackageSelector = ({
  packages,
  value,
  onChange,
  currencySymbol,
  decimalPrecision,
}: DepositPackageSelectorProps): JSX.Element => (
  <div className="space-y-1.5">
    <Label htmlFor="deposit-package">Deposit package</Label>
    {/* value is always a defined string ('' when nothing is picked yet), never
    undefined - Select must stay controlled for its entire lifetime; switching
    from an undefined (uncontrolled) value to a defined one after the first
    selection is a React anti-pattern (and logs a console warning). */}
    <Select
      value={value !== undefined ? String(value) : ''}
      onValueChange={(next) => onChange(Number(next))}
    >
      <SelectTrigger id="deposit-package" className="w-full">
        <SelectValue placeholder="Select a package" />
      </SelectTrigger>
      <SelectContent>
        {packages.map((depositPackage) => (
          <SelectItem key={depositPackage.amount} value={String(depositPackage.amount)}>
            {formatCurrency(depositPackage.amount, currencySymbol, decimalPrecision)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export default DepositPackageSelector;
