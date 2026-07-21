import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Stock } from 'shared-types';

import { stockService } from '@/services/stock.service';
import type {
  ChangeStockStatusPayload,
  CreateStockPayload,
  UpdateStockPayload,
  UpdateStockPricePayload,
} from '@/types/stock.types';

import { STOCK_QUERY_KEYS } from './useStockQueries';

// Every mutation below invalidates STOCK_QUERY_KEYS.root only - unlike
// useWithdrawalMutations.ts's useCompleteWithdrawal (which separately
// invalidates WALLET_QUERY_KEYS, a genuinely different resource), every
// stock query key (public listing, featured, categories, history, admin
// listing/detail) already nests under the same 'stocks' root, so
// invalidating it once covers the public catalog and the admin view
// together (useDepositQueries.ts's DEPOSIT_QUERY_KEYS comment: "root alone
// covers every nested key below it").

export const useCreateStock = (): UseMutationResult<Stock, Error, CreateStockPayload> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stockService.adminCreateStock,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.root });
    },
  });
};

export interface UpdateStockVariables {
  id: string;
  payload: UpdateStockPayload;
}

export const useUpdateStock = (): UseMutationResult<Stock, Error, UpdateStockVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateStockVariables) =>
      stockService.adminUpdateStock(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.root });
    },
  });
};

export interface ChangeStockStatusVariables {
  id: string;
  payload: ChangeStockStatusPayload;
}

export const useChangeStockStatus = (): UseMutationResult<
  Stock,
  Error,
  ChangeStockStatusVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: ChangeStockStatusVariables) =>
      stockService.adminChangeStockStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.root });
    },
  });
};

export interface UpdateStockPriceVariables {
  id: string;
  payload: UpdateStockPricePayload;
}

export const useUpdateStockPrice = (): UseMutationResult<
  Stock,
  Error,
  UpdateStockPriceVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateStockPriceVariables) =>
      stockService.adminUpdateStockPrice(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.root });
    },
  });
};

export const useDeleteStock = (): UseMutationResult<Stock, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: stockService.adminDeleteStock,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: STOCK_QUERY_KEYS.root });
    },
  });
};
