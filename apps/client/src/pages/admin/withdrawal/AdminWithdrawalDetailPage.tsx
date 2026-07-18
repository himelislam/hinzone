import { useState } from 'react';
import type { JSX } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { WithdrawalStatus } from 'shared-types';

import WithdrawalDetailsCard from '@/components/cards/WithdrawalDetailsCard';
import WithdrawalSummary from '@/components/cards/WithdrawalSummary';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useAdminWallet } from '@/hooks/useWalletQueries';
import {
  useApproveWithdrawal,
  useCompleteWithdrawal,
  useMarkProcessing,
  useRejectWithdrawal,
} from '@/hooks/useWithdrawalMutations';
import { useAdminWithdrawal } from '@/hooks/useWithdrawalQueries';
import { getErrorMessage } from '@/utils/get-error-message';

// tasks/breakdown/phase-06-tasks.md task 46's Admin Approval/Processing/
// Completion screen - WithdrawalDetailsCard + WithdrawalSummary (wallet
// balance, amount, fee, net amount, payment method, waiting-period result -
// phase-06.md's Admin Approval Screen spec) + status-appropriate actions,
// each behind ConfirmDialog per ui_rules.md's "destructive/approval actions
// require confirmation," Reject gated on a non-empty reason exactly like
// AdminDepositDetailPage. waitingPeriodSatisfied comes straight from the
// GET-by-id response (withdrawalService.getWaitingPeriodStatusForAdmin,
// recomputed server-side against the user's current deposit history, not
// stored on the withdrawal itself).
const AdminWithdrawalDetailPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const withdrawalQuery = useAdminWithdrawal(id ?? '');
  const currencySettingsQuery = useCurrencySettings();
  const walletQuery = useAdminWallet(withdrawalQuery.data?.walletId ?? '');
  const approveWithdrawal = useApproveWithdrawal();
  const rejectWithdrawal = useRejectWithdrawal();
  const markProcessing = useMarkProcessing();
  const completeWithdrawal = useCompleteWithdrawal();
  const navigate = useNavigate();

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (withdrawalQuery.isLoading) {
    return <LoadingState message="Loading withdrawal..." />;
  }

  if (withdrawalQuery.isError || !withdrawalQuery.data) {
    return (
      <ErrorState
        message="We couldn't load this withdrawal."
        onRetry={() => void withdrawalQuery.refetch()}
      />
    );
  }

  const withdrawal = withdrawalQuery.data;
  const isPending = withdrawal.status === WithdrawalStatus.PENDING;
  const isApproved = withdrawal.status === WithdrawalStatus.APPROVED;
  const isProcessing = withdrawal.status === WithdrawalStatus.PROCESSING;
  const canComplete = isApproved || isProcessing;

  const handleApprove = (): void => {
    approveWithdrawal.mutate(withdrawal.id, { onSuccess: () => setApproveOpen(false) });
  };

  const handleReject = (): void => {
    rejectWithdrawal.mutate(
      { id: withdrawal.id, payload: { rejectionReason } },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setRejectionReason('');
        },
      },
    );
  };

  const handleMarkProcessing = (): void => {
    markProcessing.mutate(withdrawal.id, { onSuccess: () => setProcessingOpen(false) });
  };

  const handleComplete = (): void => {
    completeWithdrawal.mutate(withdrawal.id, { onSuccess: () => setCompleteOpen(false) });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Withdrawal {withdrawal.withdrawalNumber}</h1>
        <Button type="button" variant="outline" onClick={() => void navigate('/admin/withdrawals')}>
          Back to list
        </Button>
      </div>

      <WithdrawalDetailsCard
        withdrawal={withdrawal}
        currencySymbol={currencySettingsQuery.data?.currencySymbol}
        decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        submitterLabel={withdrawal.userId}
      />

      <WithdrawalSummary
        amount={withdrawal.amount}
        fee={withdrawal.withdrawalFee}
        netAmount={withdrawal.netAmount}
        paymentMethod={withdrawal.paymentMethod}
        currencySymbol={currencySettingsQuery.data?.currencySymbol}
        decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
        walletBalance={walletQuery.data?.availableBalance}
        waitingPeriodSatisfied={withdrawal.waitingPeriodSatisfied}
      />

      {isPending ? (
        <div className="flex gap-3">
          <ConfirmDialog
            trigger={<Button type="button">Approve</Button>}
            title="Approve this withdrawal?"
            description="This confirms the request for payout. It does not move funds yet."
            confirmLabel="Approve"
            onConfirm={handleApprove}
            isConfirming={approveWithdrawal.isPending}
            error={getErrorMessage(approveWithdrawal.error)}
            open={approveOpen}
            onOpenChange={setApproveOpen}
          />

          <ConfirmDialog
            trigger={
              <Button type="button" variant="destructive">
                Reject
              </Button>
            }
            title="Reject this withdrawal?"
            description="Provide a reason the user will see. This cannot be undone."
            confirmLabel="Reject"
            confirmVariant="destructive"
            onConfirm={handleReject}
            isConfirming={rejectWithdrawal.isPending}
            confirmDisabled={rejectionReason.trim().length === 0}
            error={getErrorMessage(rejectWithdrawal.error)}
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

      {isApproved ? (
        <ConfirmDialog
          trigger={<Button type="button">Mark as processing</Button>}
          title="Move this withdrawal to processing?"
          description="Use this to track that payment is in progress."
          confirmLabel="Mark as processing"
          onConfirm={handleMarkProcessing}
          isConfirming={markProcessing.isPending}
          error={getErrorMessage(markProcessing.error)}
          open={processingOpen}
          onOpenChange={setProcessingOpen}
        />
      ) : null}

      {canComplete ? (
        <ConfirmDialog
          trigger={<Button type="button">Complete</Button>}
          title="Complete this withdrawal?"
          description="This debits the user's wallet immediately and cannot be undone."
          confirmLabel="Complete"
          onConfirm={handleComplete}
          isConfirming={completeWithdrawal.isPending}
          error={getErrorMessage(completeWithdrawal.error)}
          open={completeOpen}
          onOpenChange={setCompleteOpen}
        />
      ) : null}
    </div>
  );
};

export default AdminWithdrawalDetailPage;
