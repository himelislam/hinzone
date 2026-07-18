import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Withdrawal } from 'shared-types';

import { withdrawalService } from '@/services/withdrawal.service';
import type { CreateWithdrawalPayload, RejectWithdrawalPayload } from '@/types/withdrawal.types';

import { WALLET_QUERY_KEYS } from './useWalletQueries';
import { WITHDRAWAL_QUERY_KEYS } from './useWithdrawalQueries';

export const useCreateWithdrawal = (): UseMutationResult<
  Withdrawal,
  Error,
  CreateWithdrawalPayload
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawalService.createWithdrawal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.root });
    },
  });
};

export const useCancelWithdrawal = (): UseMutationResult<Withdrawal, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawalService.cancelWithdrawal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.root });
    },
  });
};

export const useApproveWithdrawal = (): UseMutationResult<Withdrawal, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawalService.adminApproveWithdrawal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.root });
    },
  });
};

export interface RejectWithdrawalVariables {
  id: string;
  payload: RejectWithdrawalPayload;
}

export const useRejectWithdrawal = (): UseMutationResult<
  Withdrawal,
  Error,
  RejectWithdrawalVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: RejectWithdrawalVariables) =>
      withdrawalService.adminRejectWithdrawal(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.root });
    },
  });
};

export const useMarkProcessing = (): UseMutationResult<Withdrawal, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawalService.adminMarkProcessing,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.root });
    },
  });
};

// Completion also debits the wallet (withdrawal-review.service.ts's
// completeWithdrawal - the sole withdrawal mutation that moves the balance,
// per that module's "decision 1") - invalidating WALLET_QUERY_KEYS.wallet
// alongside the withdrawal keys ensures a mounted wallet balance/summary/
// transactions view refetches instead of showing a stale pre-completion
// balance (useWalletQueries.ts's WALLET_QUERY_KEYS comment: invalidating the
// root key covers every nested key beneath it). Every other withdrawal
// mutation above only changes the withdrawal document itself, so none of
// them need this second invalidation.
export const useCompleteWithdrawal = (): UseMutationResult<Withdrawal, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withdrawalService.adminCompleteWithdrawal,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WITHDRAWAL_QUERY_KEYS.root }),
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet }),
      ]);
    },
  });
};
