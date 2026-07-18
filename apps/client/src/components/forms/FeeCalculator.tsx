import type { JSX } from 'react';

import { formatCurrency } from '@/utils/format-currency';

interface FeeCalculatorProps {
  readonly amount: number | undefined;
  readonly feePercentage: number;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// Live client-side preview only - mirrors withdrawal-fee.util.ts's
// calculateWithdrawalFee formula exactly (percentage-only fee, rounded to
// cents) so the number shown here doesn't visibly disagree with what the
// server actually persists. The authoritative fee/net amount a user sees
// post-submission always comes from the server response - this component has
// no way to enforce that, only to preview it for instant feedback while typing.
const roundToCents = (value: number): number => Math.round(value * 100) / 100;

const FeeCalculator = ({
  amount,
  feePercentage,
  currencySymbol,
  decimalPrecision,
}: FeeCalculatorProps): JSX.Element => {
  const hasAmount = amount !== undefined && amount > 0;
  const fee = hasAmount ? roundToCents((amount * feePercentage) / 100) : 0;
  const netAmount = hasAmount ? roundToCents(amount - fee) : 0;

  return (
    <dl className="bg-muted/50 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md p-3 text-sm">
      <dt className="text-muted-foreground">Fee ({feePercentage}%)</dt>
      <dd className="text-right tabular-nums">
        {hasAmount ? formatCurrency(fee, currencySymbol, decimalPrecision) : '—'}
      </dd>
      <dt className="text-muted-foreground">You will receive</dt>
      <dd className="text-right font-medium tabular-nums">
        {hasAmount ? formatCurrency(netAmount, currencySymbol, decimalPrecision) : '—'}
      </dd>
    </dl>
  );
};

export default FeeCalculator;
