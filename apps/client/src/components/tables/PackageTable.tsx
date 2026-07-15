import type { JSX } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DepositPackage } from 'shared-types';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CurrencyInput from '@/components/forms/CurrencyInput';

interface PackageTableProps {
  readonly packages: readonly DepositPackage[];
  readonly onChange: (packages: DepositPackage[]) => void;
  /** CurrencySettings.currencySymbol - shown as a prefix on each amount field. */
  readonly currencySymbol?: string;
  readonly disabled?: boolean;
}

// Deposit Settings' editable package list (docs/20-settings-system.md #10 - admins
// add/edit/remove packages without code changes). Purely controlled: every edit
// replaces the whole array via onChange, no internal state of its own.
const PackageTable = ({
  packages,
  onChange,
  currencySymbol,
  disabled = false,
}: PackageTableProps): JSX.Element => {
  const updateAmount = (index: number, amount: number): void => {
    onChange(packages.map((item, itemIndex) => (itemIndex === index ? { amount } : item)));
  };

  const removePackage = (index: number): void => {
    onChange(packages.filter((_item, itemIndex) => itemIndex !== index));
  };

  const addPackage = (): void => {
    onChange([...packages, { amount: 0 }]);
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Amount</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground py-6 text-center">
                No packages yet.
              </TableCell>
            </TableRow>
          ) : (
            packages.map((depositPackage, index) => (
              // Rows have no stable id (a plain amount value) - index is fine since
              // this list is never reordered independently of its own edits.
              <TableRow key={index}>
                <TableCell>
                  <CurrencyInput
                    value={depositPackage.amount}
                    onChange={(amount) => updateAmount(index, amount)}
                    currencySymbol={currencySymbol}
                    disabled={disabled}
                    aria-label={`Package ${index + 1} amount`}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removePackage(index)}
                    disabled={disabled}
                    aria-label={`Remove package ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Button type="button" variant="outline" size="sm" onClick={addPackage} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Add package
      </Button>
    </div>
  );
};

export default PackageTable;
