import type { JSX } from 'react';
import type { Wallet } from 'shared-types';

import WalletStatusBadge from '@/components/common/WalletStatusBadge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';

interface WalletCardProps {
  readonly wallet: Wallet;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// The wallet's identity + primary figure (tasks/phase-04.md's Wallet Dashboard) -
// a "hero" card shown above the WalletSummary grid, distinct from BalanceCard's
// generic single-stat display since it also carries the wallet's status and
// currency code.
const WalletCard = ({ wallet, currencySymbol, decimalPrecision }: WalletCardProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Wallet</CardTitle>
      <CardAction>
        <WalletStatusBadge status={wallet.status} />
      </CardAction>
    </CardHeader>
    <CardContent className="space-y-1">
      <p className="text-3xl font-semibold tabular-nums">
        {formatCurrency(wallet.availableBalance, currencySymbol, decimalPrecision)}
      </p>
      <p className="text-muted-foreground text-sm">Available balance · {wallet.currency}</p>
    </CardContent>
  </Card>
);

export default WalletCard;
