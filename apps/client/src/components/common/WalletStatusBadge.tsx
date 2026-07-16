import type { JSX } from 'react';
import { WalletStatus } from 'shared-types';

import { Badge } from '@/components/ui/badge';

interface WalletStatusBadgeProps {
  readonly status: WalletStatus;
}

type StatusBadgeVariant = 'success' | 'warning' | 'destructive';

// ui_rules.md #30 - status colors must stay consistent everywhere a status is
// shown, not just here (same pattern as ProfileCard.tsx's STATUS_BADGE_VARIANTS
// for AccountStatus). Only ACTIVE wallets may perform financial operations
// (tasks/phase-04.md), so LOCKED/FROZEN both read as attention states, with
// FROZEN (an admin-imposed hold) the more severe of the two.
const STATUS_BADGE_VARIANTS: Record<WalletStatus, StatusBadgeVariant> = {
  [WalletStatus.ACTIVE]: 'success',
  [WalletStatus.LOCKED]: 'warning',
  [WalletStatus.FROZEN]: 'destructive',
};

const WalletStatusBadge = ({ status }: WalletStatusBadgeProps): JSX.Element => (
  <Badge variant={STATUS_BADGE_VARIANTS[status]}>{status}</Badge>
);

export default WalletStatusBadge;
