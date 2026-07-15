import type { JSX } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MlmCommissionLevel } from 'shared-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CurrencyInput from '@/components/forms/CurrencyInput';

interface CommissionTableProps {
  readonly levels: readonly MlmCommissionLevel[];
  readonly onChange: (levels: MlmCommissionLevel[]) => void;
  /** CurrencySettings.currencySymbol - shown as a prefix on each package amount field. */
  readonly currencySymbol?: string;
  readonly disabled?: boolean;
}

const nextLevelNumber = (levels: readonly MlmCommissionLevel[]): number =>
  levels.reduce((max, level) => Math.max(max, level.level), 0) + 1;

// MLM Commission Settings (docs/20-settings-system.md #15) - one sub-table of
// package-amount -> commission-percentage rates per level, since a level's rates
// only make sense grouped together. Purely controlled, same as PackageTable.
const CommissionTable = ({
  levels,
  onChange,
  currencySymbol,
  disabled = false,
}: CommissionTableProps): JSX.Element => {
  const updateLevelNumber = (levelIndex: number, level: number): void => {
    onChange(levels.map((item, index) => (index === levelIndex ? { ...item, level } : item)));
  };

  const removeLevel = (levelIndex: number): void => {
    onChange(levels.filter((_item, index) => index !== levelIndex));
  };

  const addLevel = (): void => {
    onChange([...levels, { level: nextLevelNumber(levels), rates: [] }]);
  };

  const updateRate = (
    levelIndex: number,
    rateIndex: number,
    rate: MlmCommissionLevel['rates'][number],
  ): void => {
    onChange(
      levels.map((item, index) =>
        index === levelIndex
          ? { ...item, rates: item.rates.map((r, ri) => (ri === rateIndex ? rate : r)) }
          : item,
      ),
    );
  };

  const removeRate = (levelIndex: number, rateIndex: number): void => {
    onChange(
      levels.map((item, index) =>
        index === levelIndex
          ? { ...item, rates: item.rates.filter((_rate, ri) => ri !== rateIndex) }
          : item,
      ),
    );
  };

  const addRate = (levelIndex: number): void => {
    onChange(
      levels.map((item, index) =>
        index === levelIndex
          ? { ...item, rates: [...item.rates, { packageAmount: 0, commissionPercentage: 0 }] }
          : item,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {levels.map((level, levelIndex) => (
        // Levels have no stable id beyond their own editable number - index is fine
        // since add/remove always happens at the end or via an explicit row action.
        <div key={levelIndex} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Level</span>
              <Input
                type="number"
                inputMode="numeric"
                value={level.level}
                onChange={(event) => updateLevelNumber(levelIndex, event.target.valueAsNumber || 0)}
                disabled={disabled}
                className="w-20"
                aria-label={`Level ${levelIndex + 1} number`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => removeLevel(levelIndex)}
              disabled={disabled}
              aria-label={`Remove level ${level.level}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package amount</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {level.rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground py-6 text-center">
                    No rates yet.
                  </TableCell>
                </TableRow>
              ) : (
                level.rates.map((rate, rateIndex) => (
                  <TableRow key={rateIndex}>
                    <TableCell>
                      <CurrencyInput
                        value={rate.packageAmount}
                        onChange={(packageAmount) =>
                          updateRate(levelIndex, rateIndex, { ...rate, packageAmount })
                        }
                        currencySymbol={currencySymbol}
                        disabled={disabled}
                        aria-label={`Level ${level.level} rate ${rateIndex + 1} package amount`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={rate.commissionPercentage}
                        onChange={(event) =>
                          updateRate(levelIndex, rateIndex, {
                            ...rate,
                            commissionPercentage: event.target.valueAsNumber || 0,
                          })
                        }
                        disabled={disabled}
                        aria-label={`Level ${level.level} rate ${rateIndex + 1} commission percentage`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRate(levelIndex, rateIndex)}
                        disabled={disabled}
                        aria-label={`Remove level ${level.level} rate ${rateIndex + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addRate(levelIndex)}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
            Add rate
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addLevel} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Add level
      </Button>
    </div>
  );
};

export default CommissionTable;
