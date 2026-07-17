import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Deposit } from 'shared-types';

import { depositService } from '@/services/deposit.service';
import type { CreateDepositPayload, RejectDepositPayload } from '@/types/deposit.types';

import { DEPOSIT_QUERY_KEYS } from './useDepositQueries';
import { WALLET_QUERY_KEYS } from './useWalletQueries';

export const useCreateDeposit = (): UseMutationResult<Deposit, Error, CreateDepositPayload> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: depositService.createDeposit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEPOSIT_QUERY_KEYS.root });
    },
  });
};

export const useCancelDeposit = (): UseMutationResult<Deposit, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: depositService.cancelDeposit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEPOSIT_QUERY_KEYS.root });
    },
  });
};

// Approval also credits the wallet (deposit.service.ts's approveDeposit) -
// invalidating WALLET_QUERY_KEYS.wallet alongside the deposit keys ensures a
// mounted wallet balance/summary/transactions view refetches instead of
// showing a stale pre-approval balance (useWalletQueries.ts's WALLET_QUERY_KEYS
// comment: invalidating the root key covers every nested key beneath it).
export const useApproveDeposit = (): UseMutationResult<Deposit, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: depositService.adminApproveDeposit,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DEPOSIT_QUERY_KEYS.root }),
        queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet }),
      ]);
    },
  });
};

export interface RejectDepositVariables {
  id: string;
  payload: RejectDepositPayload;
}

export const useRejectDeposit = (): UseMutationResult<Deposit, Error, RejectDepositVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: RejectDepositVariables) =>
      depositService.adminRejectDeposit(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DEPOSIT_QUERY_KEYS.root });
    },
  });
};
