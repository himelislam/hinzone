import type { JSX } from 'react';
import { WithdrawalStatus } from 'shared-types';

import { Badge } from '@/components/ui/badge';

interface WithdrawalStatusBadgeProps {
  readonly status: WithdrawalStatus;
}

type StatusBadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'default';

// ui_rules.md #30 - status colors must stay consistent everywhere a status is
// shown, same mapping convention as DepositStatusBadge/TransactionBadge.
// APPROVED and PROCESSING are both "admin is actively handling this, not yet
// final" states - components/ui/badge.tsx has no dedicated "info" variant, so
// APPROVED uses the primary-colored `default` variant to stay visually
// distinct from PENDING's `warning` (awaiting first review) and
// PROCESSING's `warning` (payment in flight, same urgency-adjacent color).
const STATUS_BADGE_VARIANTS: Record<WithdrawalStatus, StatusBadgeVariant> = {
  [WithdrawalStatus.PENDING]: 'warning',
  [WithdrawalStatus.APPROVED]: 'default',
  [WithdrawalStatus.PROCESSING]: 'warning',
  [WithdrawalStatus.COMPLETED]: 'success',
  [WithdrawalStatus.REJECTED]: 'destructive',
  [WithdrawalStatus.CANCELLED]: 'secondary',
};

const WithdrawalStatusBadge = ({ status }: WithdrawalStatusBadgeProps): JSX.Element => (
  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{status}</Badge>
);

export default WithdrawalStatusBadge;
