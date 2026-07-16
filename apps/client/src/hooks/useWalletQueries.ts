import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { PaginatedResponse, Transaction, Wallet, WalletSummary } from 'shared-types';

import { walletService } from '@/services/wallet.service';
import type { TransactionListParams } from '@/types/wallet.types';

import { useAuth } from './useAuth';

// Hierarchical so a future invalidation of ['wallet'] (e.g. after a deposit or
// withdrawal completes) covers every nested key too - same convention as
// useSettingsQueries.ts's SETTINGS_QUERY_KEYS.
export const WALLET_QUERY_KEYS = {
  wallet: ['wallet'] as const,
  summary: ['wallet', 'summary'] as const,
  transactions: (params: TransactionListParams = {}) => ['wallet', 'transactions', params] as const,
  transaction: (id: string) => ['wallet', 'transactions', id] as const,
};

// A wallet balance should reflect a deposit/withdrawal/trade soon after it
// happens, unlike useSettingsQueries.ts's rarely-changing config (5 minutes) -
// short enough to stay reasonably fresh without refetching on every render.
const WALLET_STALE_TIME_MS = 30 * 1000;

export const useWallet = (): UseQueryResult<Wallet, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallet,
    queryFn: walletService.getWallet,
    enabled: isAuthenticated,
    staleTime: WALLET_STALE_TIME_MS,
  });
};

export const useWalletSummary = (): UseQueryResult<WalletSummary, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.summary,
    queryFn: walletService.getWalletSummary,
    enabled: isAuthenticated,
    staleTime: WALLET_STALE_TIME_MS,
  });
};

export const useTransactions = (
  params: TransactionListParams = {},
): UseQueryResult<PaginatedResponse<Transaction>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.transactions(params),
    queryFn: () => walletService.getTransactions(params),
    enabled: isAuthenticated,
    staleTime: WALLET_STALE_TIME_MS,
  });
};

export const useWalletTransaction = (id: string): UseQueryResult<Transaction, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: WALLET_QUERY_KEYS.transaction(id),
    queryFn: () => walletService.getTransactionById(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: WALLET_STALE_TIME_MS,
  });
};
