import type { JSX } from 'react';
import type { Deposit } from 'shared-types';

import DepositStatusBadge from '@/components/common/DepositStatusBadge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';

interface DepositCardProps {
  readonly deposit: Deposit;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// Compact summary card for a single deposit - same layout convention as
// WalletCard: title + status badge in the header, the primary figure in the body.
const DepositCard = ({
  deposit,
  currencySymbol,
  decimalPrecision,
}: DepositCardProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{deposit.depositNumber}</CardTitle>
      <CardAction>
        <DepositStatusBadge status={deposit.status} />
      </CardAction>
    </CardHeader>
    <CardContent className="space-y-1">
      <p className="text-3xl font-semibold tabular-nums">
        {formatCurrency(deposit.amount, currencySymbol, decimalPrecision)}
      </p>
      <p className="text-muted-foreground text-sm">
        {deposit.paymentMethod} · {new Date(deposit.createdAt).toLocaleDateString()}
      </p>
    </CardContent>
  </Card>
);

export default DepositCard;
