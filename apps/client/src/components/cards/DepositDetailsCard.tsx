import type { JSX } from 'react';
import type { Deposit } from 'shared-types';

import DepositStatusBadge from '@/components/common/DepositStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';

interface DepositDetailsCardProps {
  readonly deposit: Deposit;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
  // Resolved separately by the caller (e.g. an admin page joining userId to a
  // username) - Deposit only carries userId, not a display name.
  readonly submitterLabel?: string;
}

// Full detail view for one deposit - used by both the user's own detail page
// and the admin approval screen (tasks/phase-05.md), which composes its own
// Approve/Reject actions around this rather than this component owning them,
// so it stays purely presentational and reusable in both contexts.
const DepositDetailsCard = ({
  deposit,
  currencySymbol,
  decimalPrecision,
  submitterLabel,
}: DepositDetailsCardProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center justify-between text-lg">
        <span>{deposit.depositNumber}</span>
        <DepositStatusBadge status={deposit.status} />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="text-3xl font-semibold tabular-nums">
          {formatCurrency(deposit.amount, currencySymbol, decimalPrecision)}
        </p>
        <p className="text-muted-foreground text-sm">{deposit.currency}</p>
      </div>

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {submitterLabel ? (
          <div>
            <dt className="text-muted-foreground text-xs">Submitted by</dt>
            <dd className="text-sm">{submitterLabel}</dd>
          </div>
        ) : null}

        <div>
          <dt className="text-muted-foreground text-xs">Payment method</dt>
          <dd className="text-sm">{deposit.paymentMethod}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Sender account number</dt>
          <dd className="text-sm">{deposit.senderAccountNumber}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Payment reference</dt>
          <dd className="text-sm">{deposit.paymentReference}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground text-xs">Submitted</dt>
          <dd className="text-sm">{new Date(deposit.createdAt).toLocaleString()}</dd>
        </div>

        {deposit.reviewedAt ? (
          <div>
            <dt className="text-muted-foreground text-xs">Reviewed</dt>
            <dd className="text-sm">{new Date(deposit.reviewedAt).toLocaleString()}</dd>
          </div>
        ) : null}

        {deposit.adminNote ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Admin note</dt>
            <dd className="text-sm">{deposit.adminNote}</dd>
          </div>
        ) : null}

        {deposit.rejectionReason ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Rejection reason</dt>
            <dd className="text-destructive text-sm">{deposit.rejectionReason}</dd>
          </div>
        ) : null}
      </dl>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs">Payment screenshot</p>
        <img
          src={deposit.screenshotUrl}
          alt="Payment screenshot"
          className="border-border max-h-96 w-full rounded-lg border object-contain"
        />
      </div>
    </CardContent>
  </Card>
);

export default DepositDetailsCard;
