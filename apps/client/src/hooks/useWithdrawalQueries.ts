import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { PaginatedResponse, Withdrawal } from 'shared-types';

import { withdrawalService } from '@/services/withdrawal.service';
import type { WithdrawalListParams } from '@/types/withdrawal.types';

import { useAuth } from './useAuth';

// Hierarchical so `root` alone covers every nested key below it - same
// convention as useDepositQueries.ts's DEPOSIT_QUERY_KEYS. `admin` keys are
// namespaced separately from the user-facing ones since they list a different
// (cross-user) result set even though both share the same WithdrawalListParams
// shape (the server reuses one Zod schema for both endpoints).
export const WITHDRAWAL_QUERY_KEYS = {
  root: ['withdrawals'] as const,
  withdrawals: (params: WithdrawalListParams = {}) => ['withdrawals', params] as const,
  withdrawal: (id: string) => ['withdrawals', 'detail', id] as const,
  adminWithdrawals: (params: WithdrawalListParams = {}) =>
    ['withdrawals', 'admin', params] as const,
  adminWithdrawal: (id: string) => ['withdrawals', 'admin', 'detail', id] as const,
};

// A withdrawal's status only changes through an explicit action (admin
// approve/reject/processing/complete, user cancel), never spontaneously -
// same freshness window as useDepositQueries.ts's DEPOSIT_STALE_TIME_MS.
const WITHDRAWAL_STALE_TIME_MS = 60 * 1000;

export const useWithdrawals = (
  params: WithdrawalListParams = {},
): UseQueryResult<PaginatedResponse<Withdrawal>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.withdrawals(params),
    queryFn: () => withdrawalService.getWithdrawals(params),
    enabled: isAuthenticated,
    staleTime: WITHDRAWAL_STALE_TIME_MS,
  });
};

export const useWithdrawal = (id: string): UseQueryResult<Withdrawal, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.withdrawal(id),
    queryFn: () => withdrawalService.getWithdrawalById(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: WITHDRAWAL_STALE_TIME_MS,
  });
};

export const useAdminWithdrawals = (
  params: WithdrawalListParams = {},
): UseQueryResult<PaginatedResponse<Withdrawal>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.adminWithdrawals(params),
    queryFn: () => withdrawalService.adminListWithdrawals(params),
    enabled: isAuthenticated,
    staleTime: WITHDRAWAL_STALE_TIME_MS,
  });
};

export const useAdminWithdrawal = (id: string): UseQueryResult<Withdrawal, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WITHDRAWAL_QUERY_KEYS.adminWithdrawal(id),
    queryFn: () => withdrawalService.adminGetWithdrawalById(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: WITHDRAWAL_STALE_TIME_MS,
  });
};
