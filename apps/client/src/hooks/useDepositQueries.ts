import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Deposit, PaginatedResponse } from 'shared-types';

import { depositService } from '@/services/deposit.service';
import type { DepositListParams } from '@/types/deposit.types';

import { useAuth } from './useAuth';

// Hierarchical so `root` alone covers every nested key below it - same
// convention as useWalletQueries.ts's WALLET_QUERY_KEYS. `admin` keys are
// namespaced separately from the user-facing ones since they list a different
// (cross-user) result set even though both share the same DepositListParams
// shape (the server reuses one Zod schema for both endpoints).
export const DEPOSIT_QUERY_KEYS = {
  root: ['deposits'] as const,
  deposits: (params: DepositListParams = {}) => ['deposits', params] as const,
  deposit: (id: string) => ['deposits', 'detail', id] as const,
  adminDeposits: (params: DepositListParams = {}) => ['deposits', 'admin', params] as const,
  adminDeposit: (id: string) => ['deposits', 'admin', 'detail', id] as const,
};

// A deposit's status only changes through an explicit action (admin
// approve/reject, user cancel), never spontaneously - longer than
// useWalletQueries.ts's 30s balance freshness, shorter than
// useSettingsQueries.ts's rarely-changing config.
const DEPOSIT_STALE_TIME_MS = 60 * 1000;

export const useDeposits = (
  params: DepositListParams = {},
): UseQueryResult<PaginatedResponse<Deposit>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: DEPOSIT_QUERY_KEYS.deposits(params),
    queryFn: () => depositService.getDeposits(params),
    enabled: isAuthenticated,
    staleTime: DEPOSIT_STALE_TIME_MS,
  });
};

export const useDeposit = (id: string): UseQueryResult<Deposit, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: DEPOSIT_QUERY_KEYS.deposit(id),
    queryFn: () => depositService.getDepositById(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: DEPOSIT_STALE_TIME_MS,
  });
};

export const useAdminDeposits = (
  params: DepositListParams = {},
): UseQueryResult<PaginatedResponse<Deposit>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: DEPOSIT_QUERY_KEYS.adminDeposits(params),
    queryFn: () => depositService.adminListDeposits(params),
    enabled: isAuthenticated,
    staleTime: DEPOSIT_STALE_TIME_MS,
  });
};

export const useAdminDeposit = (id: string): UseQueryResult<Deposit, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: DEPOSIT_QUERY_KEYS.adminDeposit(id),
    queryFn: () => depositService.adminGetDepositById(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: DEPOSIT_STALE_TIME_MS,
  });
};
