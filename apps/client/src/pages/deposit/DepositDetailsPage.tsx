import { useState } from 'react';
import type { JSX } from 'react';
import { useParams } from 'react-router-dom';
import { DepositStatus } from 'shared-types';

import DepositDetailsCard from '@/components/cards/DepositDetailsCard';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { Button } from '@/components/ui/button';
import { useCancelDeposit } from '@/hooks/useDepositMutations';
import { useDeposit } from '@/hooks/useDepositQueries';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { getErrorMessage } from '@/utils/get-error-message';

// tasks/phase-05.md's Deposit Details page - DepositDetailsCard wired to
// useDeposit(id), with a Cancel action only shown while PENDING (deposit.service.ts's
// cancelDeposit rejects any other status) - behind a confirmation dialog per
// ui_rules.md's "destructive actions must require confirmation."
const DepositDetailsPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const depositQuery = useDeposit(id ?? '');
  const currencySettingsQuery = useCurrencySettings();
  const cancelDeposit = useCancelDeposit();
  const [cancelOpen, setCancelOpen] = useState(false);

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

  const handleCancel = (): void => {
    cancelDeposit.mutate(deposit.id, {
      onSuccess: () => setCancelOpen(false),
    });
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Deposit {deposit.depositNumber}</h1>

      <DepositDetailsCard
        deposit={deposit}
        currencySymbol={currencySettingsQuery.data?.currencySymbol}
        decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
      />

      {deposit.status === DepositStatus.PENDING ? (
        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive">
              Cancel deposit
            </Button>
          }
          title="Cancel this deposit request?"
          description="This cannot be undone. You will need to submit a new request to deposit again."
          confirmLabel="Cancel deposit"
          confirmVariant="destructive"
          onConfirm={handleCancel}
          isConfirming={cancelDeposit.isPending}
          error={getErrorMessage(cancelDeposit.error)}
          open={cancelOpen}
          onOpenChange={setCancelOpen}
        />
      ) : null}
    </div>
  );
};

export default DepositDetailsPage;
