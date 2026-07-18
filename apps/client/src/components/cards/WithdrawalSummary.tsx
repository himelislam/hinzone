import type { JSX } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';

interface WithdrawalSummaryProps {
  readonly amount: number;
  readonly fee: number;
  readonly netAmount: number;
  readonly paymentMethod: string;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
  // Only meaningful on the admin approval screen (tasks/phase-06.md's Admin
  // Approval Screen: "Wallet Balance", "Waiting Period Validation Result") -
  // the create-form's own confirmation step has no need for either, so both
  // stay optional rather than forcing every caller to supply them.
  readonly walletBalance?: number;
  readonly waitingPeriodSatisfied?: boolean;
}

// Presentational recap block reused by both the create-form's confirmation
// step and the admin approval screen (tasks/phase-06.md's Admin Approval
// Screen "Display" requirements) - neither owns any action buttons of its
// own, same reuse split DepositDetailsCard already established.
const WithdrawalSummary = ({
  amount,
  fee,
  netAmount,
  paymentMethod,
  currencySymbol,
  decimalPrecision,
  walletBalance,
  waitingPeriodSatisfied,
}: WithdrawalSummaryProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Withdrawal summary</CardTitle>
    </CardHeader>
    <CardContent>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {walletBalance !== undefined ? (
          <>
            <dt className="text-muted-foreground">Wallet balance</dt>
            <dd className="text-right tabular-nums">
              {formatCurrency(walletBalance, currencySymbol, decimalPrecision)}
            </dd>
          </>
        ) : null}

        <dt className="text-muted-foreground">Amount</dt>
        <dd className="text-right tabular-nums">
          {formatCurrency(amount, currencySymbol, decimalPrecision)}
        </dd>

        <dt className="text-muted-foreground">Fee</dt>
        <dd className="text-right tabular-nums">
          {formatCurrency(fee, currencySymbol, decimalPrecision)}
        </dd>

        <dt className="text-muted-foreground">Net amount</dt>
        <dd className="text-right font-medium tabular-nums">
          {formatCurrency(netAmount, currencySymbol, decimalPrecision)}
        </dd>

        <dt className="text-muted-foreground">Payment method</dt>
        <dd className="text-right">{paymentMethod}</dd>

        {waitingPeriodSatisfied !== undefined ? (
          <>
            <dt className="text-muted-foreground">Waiting period</dt>
            <dd
              className={
                waitingPeriodSatisfied ? 'text-success text-right' : 'text-destructive text-right'
              }
            >
              {waitingPeriodSatisfied ? 'Satisfied' : 'Not satisfied'}
            </dd>
          </>
        ) : null}
      </dl>
    </CardContent>
  </Card>
);

export default WithdrawalSummary;
