import { useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { WithdrawalStatus } from 'shared-types';

import WithdrawalDetailsCard from '@/components/cards/WithdrawalDetailsCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useCancelWithdrawal } from '@/hooks/useWithdrawalMutations';
import { useWithdrawal } from '@/hooks/useWithdrawalQueries';
import { getErrorMessage } from '@/utils/get-error-message';

// WithdrawalDetailsCard wired to useWithdrawal(id), with a Cancel action only
// shown while PENDING (withdrawal.service.ts's cancelWithdrawal rejects any
// other status) - behind a confirmation dialog per ui_rules.md's
// "destructive actions must require confirmation," same structure as
// DepositDetailsPage.
const WithdrawalDetailsPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const withdrawalQuery = useWithdrawal(id ?? '');
  const currencySettingsQuery = useCurrencySettings();
  const cancelWithdrawal = useCancelWithdrawal();
  const [cancelOpen, setCancelOpen] = useState(false);

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

  const handleCancel = (): void => {
    cancelWithdrawal.mutate(withdrawal.id, {
      onSuccess: () => setCancelOpen(false),
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Withdrawal {withdrawal.withdrawalNumber}</h1>

      <WithdrawalDetailsCard
        withdrawal={withdrawal}
        currencySymbol={currencySettingsQuery.data?.currencySymbol}
        decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
      />

      {withdrawal.status === WithdrawalStatus.PENDING ? (
        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive">
              Cancel withdrawal
            </Button>
          }
          title="Cancel this withdrawal request?"
          description="This cannot be undone. You will need to submit a new request to withdraw again."
          confirmLabel="Cancel withdrawal"
          confirmVariant="destructive"
          onConfirm={handleCancel}
          isConfirming={cancelWithdrawal.isPending}
          error={getErrorMessage(cancelWithdrawal.error)}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      ) : null}
    </div>
  );
};

export default WithdrawalDetailsPage;
