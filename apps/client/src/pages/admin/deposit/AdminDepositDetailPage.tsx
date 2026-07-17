import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DepositStatus } from 'shared-types';

import DepositDetailsCard from '@/components/cards/DepositDetailsCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApproveDeposit, useRejectDeposit } from '@/hooks/useDepositMutations';
import { useAdminDeposit } from '@/hooks/useDepositQueries';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';

// tasks/phase-05.md's Admin Approval/Rejection screen - DepositDetailsCard
// (screenshot preview included) + Approve/Reject actions, each behind
// ConfirmDialog (ui_rules.md's "destructive/approval actions require
// confirmation"). Reject requires a non-empty reason before the confirm
// button enables. adminNote isn't collected on approve - admin-deposit.controller.ts
// doesn't expose it on that endpoint yet (deposit.validation.ts has no schema
// for it), so there is nothing to wire up here either.
const AdminDepositDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const depositQuery = useAdminDeposit(id ?? '');
  const currencySettingsQuery = useCurrencySettings();
  const approveDeposit = useApproveDeposit();
  const rejectDeposit = useRejectDeposit();
  const navigate = useNavigate();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (depositQuery.isLoading) {
    return <LoadingState message="Loading deposit..." />;
  }

  if (depositQuery.isError || !depositQuery.data) {
    return (
      <ErrorState
        message="We couldn't load this deposit."
        onRetry={() => void depositQuery.refetch()}
      />
    );
  }

  const deposit = depositQuery.data;
  const isPending = deposit.status === DepositStatus.PENDING;

  const handleApprove = (): void => {
    approveDeposit.mutate(deposit.id, { onSuccess: () => setApproveOpen(false) });
  };

  const handleReject = (): void => {
    rejectDeposit.mutate(
      { id: deposit.id, payload: { rejectionReason } },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setRejectionReason('');
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Deposit {deposit.depositNumber}</h1>
        <Button type="button" variant="outline" onClick={() => void navigate('/admin/deposits')}>
          Back to list
        </Button>
      </div>

      <DepositDetailsCard
        deposit={deposit}
        currencySymbol={currencySettingsQuery.data?.currencySymbol}
        decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        submitterLabel={deposit.userId}
      />

      {isPending ? (
        <div className="flex gap-3">
          <ConfirmDialog
            trigger={<Button type="button">Approve</Button>}
            title="Approve this deposit?"
            description="This credits the user's wallet immediately and cannot be undone."
            confirmLabel="Approve"
            onConfirm={handleApprove}
            isConfirming={approveDeposit.isPending}
            error={getErrorMessage(approveDeposit.error)}
            open={approveOpen}
            onOpenChange={setApproveOpen}
          />

          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive">
                Reject
              </Button>
            }
            title="Reject this deposit?"
            description="Provide a reason the user will see. This cannot be undone."
            confirmLabel="Reject"
            confirmVariant="destructive"
            onConfirm={handleReject}
            isConfirming={rejectDeposit.isPending}
            confirmDisabled={rejectionReason.trim().length === 0}
            error={getErrorMessage(rejectDeposit.error)}
            open={rejectOpen}
            onOpenChange={setRejectOpen}
          >
            <div className="space-y-1.5">
              <Label htmlFor="rejection-reason">Rejection reason</Label>
              <Textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
              />
            </div>
          </ConfirmDialog>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDepositDetailPage;
