import type { JSX } from 'react';
import { StockStatus } from 'shared-types';

import { Badge } from '@/components/ui/badge';

interface StockStatusBadgeProps {
  readonly status: StockStatus;
}

type StatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

// ui_rules.md #30 - status colors must stay consistent everywhere a status is
// shown, same mapping convention as DepositStatusBadge/WithdrawalStatusBadge.
const STATUS_BADGE_VARIANTS: Record<StockStatus, StatusBadgeVariant> = {
  [StockStatus.ACTIVE]: 'success',
  [StockStatus.INACTIVE]: 'secondary',
  [StockStatus.SUSPENDED]: 'warning',
  [StockStatus.ARCHIVED]: 'destructive',
};

const StockStatusBadge = ({ status }: StockStatusBadgeProps): JSX.Element => (
  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{status}</Badge>
);

export default StockStatusBadge;
