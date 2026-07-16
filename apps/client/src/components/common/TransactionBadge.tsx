import type { JSX } from 'react';
import { TransactionCategory, TransactionStatus, TransactionType } from 'shared-types';

import { Badge } from '@/components/ui/badge';

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';

// Exactly one of status/type/category - a discriminated union rather than three
// separate components, since TransactionTable needs the same badge treatment
// for all three of a transaction's badge-worthy columns (tasks/phase-04.md's
// Category/Type/Status columns) and this keeps the color-mapping logic in one
// place instead of duplicated per column.
type TransactionBadgeProps =
  | { readonly status: TransactionStatus; readonly type?: never; readonly category?: never }
  | { readonly type: TransactionType; readonly status?: never; readonly category?: never }
  | { readonly category: TransactionCategory; readonly status?: never; readonly type?: never };

// ui_rules.md #30 - status colors must stay consistent everywhere a status is
// shown.
const STATUS_VARIANTS: Record<TransactionStatus, BadgeVariant> = {
  [TransactionStatus.PENDING]: 'warning',
  [TransactionStatus.COMPLETED]: 'success',
  [TransactionStatus.FAILED]: 'destructive',
  [TransactionStatus.CANCELLED]: 'secondary',
};

const TYPE_VARIANTS: Record<TransactionType, BadgeVariant> = {
  [TransactionType.CREDIT]: 'success',
  [TransactionType.DEBIT]: 'destructive',
};

// Categories (DEPOSIT, MLM_BONUS, ...) have no good/bad semantic, so they get a
// neutral outline treatment - same as ProfileCard.tsx's <Badge variant="outline">
// for a descriptive-but-non-status field (role).
const TransactionBadge = (props: TransactionBadgeProps): JSX.Element => {
  if (props.status) {
    return <Badge variant={STATUS_VARIANTS[props.status]}>{props.status}</Badge>;
  }

  if (props.type) {
    return <Badge variant={TYPE_VARIANTS[props.type]}>{props.type}</Badge>;
  }

  return <Badge variant="outline">{props.category}</Badge>;
};

export default TransactionBadge;
