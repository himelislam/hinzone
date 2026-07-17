import type { JSX } from 'react';
import { DepositStatus } from 'shared-types';

import { Badge } from '@/components/ui/badge';

interface DepositStatusBadgeProps {
  readonly status: DepositStatus;
}

type StatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary';

// ui_rules.md #30 - status colors must stay consistent everywhere a status is
// shown, same mapping convention as WalletStatusBadge/TransactionBadge: success
// for the terminal "good" state, warning while still awaiting admin review,
// destructive for a rejection, secondary (neutral) for a user-initiated
// cancellation - same treatment TransactionBadge gives TransactionStatus.CANCELLED.
const STATUS_BADGE_VARIANTS: Record<DepositStatus, StatusBadgeVariant> = {
  [DepositStatus.PENDING]: 'warning',
  [DepositStatus.APPROVED]: 'success',
  [DepositStatus.REJECTED]: 'destructive',
  [DepositStatus.CANCELLED]: 'secondary',
};

const DepositStatusBadge = ({ status }: DepositStatusBadgeProps): JSX.Element => (
  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{status}</Badge>
);

export default DepositStatusBadge;
