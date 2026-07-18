import type { JSX } from 'react';
import type { Withdrawal } from 'shared-types';

import WithdrawalStatusBadge from '@/components/common/WithdrawalStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';

interface WithdrawalDetailsCardProps {
  readonly withdrawal: Withdrawal;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
  // Resolved separately by the caller (e.g. an admin page joining userId to a
  // username) - Withdrawal only carries userId, not a display name, same as
  // DepositDetailsCard's submitterLabel.
  readonly submitterLabel?: string;
}

// Full detail view for one withdrawal - used by both the user's own detail
// page and the admin approval screen, which composes its own Approve/Reject/
// Processing/Complete actions around this rather than this component owning
// them, so it stays purely presentational and reusable in both contexts
// (same split DepositDetailsCard already established).
const WithdrawalDetailsCard = ({
  withdrawal,
  currencySymbol,
  decimalPrecision,
  submitterLabel,
}: WithdrawalDetailsCardProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between text-lg">
        <span>{withdrawal.withdrawalNumber}</span>
        <WithdrawalStatusBadge status={withdrawal.status} />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="text-3xl font-semibold tabular-nums">
          {formatCurrency(withdrawal.amount, currencySymbol, decimalPrecision)}
        </p>
        <p className="text-muted-foreground text-sm">{withdrawal.currency}</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {submitterLabel ? (
          <div>
            <dt className="text-muted-foreground text-xs">Submitted by</dt>
            <dd className="text-sm">{submitterLabel}</dd>
          </div>
        ) : null}

        <div>
          <dt className="text-muted-foreground text-xs">Fee</dt>
          <dd className="text-sm tabular-nums">
            {formatCurrency(withdrawal.withdrawalFee, currencySymbol, decimalPrecision)}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Net amount</dt>
          <dd className="text-sm tabular-nums">
            {formatCurrency(withdrawal.netAmount, currencySymbol, decimalPrecision)}
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Payment method</dt>
          <dd className="text-sm">{withdrawal.paymentMethod}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Receiver account number</dt>
          <dd className="text-sm">{withdrawal.receiverAccountNumber}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Account holder name</dt>
          <dd className="text-sm">{withdrawal.accountHolderName}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Submitted</dt>
          <dd className="text-sm">{new Date(withdrawal.createdAt).toLocaleString()}</dd>
        </div>

        {withdrawal.reviewedAt ? (
          <div>
            <dt className="text-muted-foreground text-xs">Reviewed</dt>
            <dd className="text-sm">{new Date(withdrawal.reviewedAt).toLocaleString()}</dd>
          </div>
        ) : null}

        {withdrawal.completedAt ? (
          <div>
            <dt className="text-muted-foreground text-xs">Completed</dt>
            <dd className="text-sm">{new Date(withdrawal.completedAt).toLocaleString()}</dd>
          </div>
        ) : null}

        {withdrawal.adminNote ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Admin note</dt>
            <dd className="text-sm">{withdrawal.adminNote}</dd>
          </div>
        ) : null}

        {withdrawal.rejectionReason ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Rejection reason</dt>
            <dd className="text-destructive text-sm">{withdrawal.rejectionReason}</dd>
          </div>
        ) : null}
      </dl>
    </CardContent>
  </Card>
);

export default WithdrawalDetailsCard;
