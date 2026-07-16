import type { JSX } from 'react';
import type { WalletSummary as WalletSummaryData } from 'shared-types';

import BalanceCard from '@/components/cards/BalanceCard';

interface WalletSummaryProps {
  readonly summary: WalletSummaryData;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// GET /wallet/summary (tasks/phase-04.md's Wallet Summary) rendered as a grid of
// BalanceCards, one per figure - matches ui_rules.md #14's "Dashboard metrics
// should use reusable cards."
const WalletSummary = ({
  summary,
  currencySymbol,
  decimalPrecision,
}: WalletSummaryProps): JSX.Element => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <BalanceCard
      label="Available balance"
      amount={summary.availableBalance}
      currencySymbol={currencySymbol}
      decimalPrecision={decimalPrecision}
    />
    <BalanceCard
      label="Pending balance"
      amount={summary.pendingBalance}
      currencySymbol={currencySymbol}
      decimalPrecision={decimalPrecision}
    />
    <BalanceCard
      label="Total deposited"
      amount={summary.totalDeposited}
      currencySymbol={currencySymbol}
      decimalPrecision={decimalPrecision}
    />
    <BalanceCard
      label="Total withdrawn"
      amount={summary.totalWithdrawn}
      currencySymbol={currencySymbol}
      decimalPrecision={decimalPrecision}
    />
    <BalanceCard
      label="Total investment"
      amount={summary.totalInvestment}
      currencySymbol={currencySymbol}
      decimalPrecision={decimalPrecision}
    />
    <BalanceCard
      label="Total profit"
      amount={summary.totalProfit}
      currencySymbol={currencySymbol}
      decimalPrecision={decimalPrecision}
    />
  </div>
);

export default WalletSummary;
