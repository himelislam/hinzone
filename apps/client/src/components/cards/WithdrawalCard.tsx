import type { JSX } from 'react';
import type { Withdrawal } from 'shared-types';

import WithdrawalStatusBadge from '@/components/common/WithdrawalStatusBadge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';

interface WithdrawalCardProps {
  readonly withdrawal: Withdrawal;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// Compact summary card for a single withdrawal - same layout convention as
// DepositCard/WalletCard: title + status badge in the header, the primary
// figure in the body.
const WithdrawalCard = ({
  withdrawal,
  currencySymbol,
  decimalPrecision,
}: WithdrawalCardProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{withdrawal.withdrawalNumber}</CardTitle>
      <CardAction>
        <WithdrawalStatusBadge status={withdrawal.status} />
      </CardAction>
    </CardHeader>
    <CardContent className="space-y-1">
      <p className="text-3xl font-semibold tabular-nums">
        {formatCurrency(withdrawal.amount, currencySymbol, decimalPrecision)}
      </p>
      <p className="text-muted-foreground text-sm">
        {withdrawal.paymentMethod} · {new Date(withdrawal.createdAt).toLocaleDateString()}
      </p>
    </CardContent>
  </Card>
);

export default WithdrawalCard;
