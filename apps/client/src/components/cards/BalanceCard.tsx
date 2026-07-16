import type { JSX, ReactNode } from 'react';

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format-currency';

interface BalanceCardProps {
  readonly label: string;
  readonly amount: number;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
  readonly icon?: ReactNode;
  readonly className?: string;
}

// A single monetary stat (Available Balance, Total Deposits, ...) - ui_rules.md
// #14's "Dashboard Cards: Title, Value, Optional icon." WalletSummary renders a
// grid of these; WalletCard uses its own layout for the wallet's primary figure
// since it also needs to show status.
const BalanceCard = ({
  label,
  amount,
  currencySymbol,
  decimalPrecision,
  icon,
  className,
}: BalanceCardProps): JSX.Element => (
  <Card className={cn(className)}>
    <CardHeader>
      <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
      {icon ? <CardAction className="text-muted-foreground">{icon}</CardAction> : null}
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold tabular-nums">
        {formatCurrency(amount, currencySymbol, decimalPrecision)}
      </p>
    </CardContent>
  </Card>
);

export default BalanceCard;
