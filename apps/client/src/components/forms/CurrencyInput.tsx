import type { ChangeEvent, ComponentProps, JSX } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
  readonly value: number;
  readonly onChange: (value: number) => void;
  /** e.g. "$" or "৳" (CurrencySettings.currencySymbol) - defaults to no prefix. */
  readonly currencySymbol?: string;
}

// A monetary amount field (deposit/withdrawal limits, package amounts, demo
// balance, ...) - every numeric-with-currency field across the settings forms
// uses this instead of a bare <Input type="number">, so the symbol and rounding
// behavior stay consistent everywhere. Never emits NaN - an empty or invalid
// field is reported as 0 rather than leaking an unparseable value into form state.
const CurrencyInput = ({
  value,
  onChange,
  currencySymbol,
  className,
  ...props
}: CurrencyInputProps): JSX.Element => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const parsed = event.target.valueAsNumber;

    onChange(Number.isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="relative">
      {currencySymbol ? (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
          {currencySymbol}
        </span>
      ) : null}
      <Input
        type="number"
        inputMode="decimal"
        value={Number.isNaN(value) ? '' : value}
        onChange={handleChange}
        className={cn(currencySymbol ? 'pl-8' : undefined, className)}
        {...props}
      />
    </div>
  );
};

export default CurrencyInput;
