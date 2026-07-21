import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { MarketHistory, PaginatedResponse, Stock } from 'shared-types';

import { stockService } from '@/services/stock.service';
import type {
  AdminStockListParams,
  StockHistoryParams,
  StockListParams,
} from '@/types/stock.types';

import { useAuth } from './useAuth';

// Hierarchical so `root` alone covers every nested key below it - same
// convention as useDepositQueries.ts's DEPOSIT_QUERY_KEYS. `admin` keys are
// namespaced separately from the public catalog view since they list a
// different (cross-status, includes non-ACTIVE stock) result set.
export const STOCK_QUERY_KEYS = {
  root: ['stocks'] as const,
  stocks: (params: StockListParams = {}) => ['stocks', params] as const,
  stock: (id: string) => ['stocks', 'detail', id] as const,
  featured: ['stocks', 'featured'] as const,
  categories: ['stocks', 'categories'] as const,
  history: (id: string, params: StockHistoryParams = {}) =>
    ['stocks', 'detail', id, 'history', params] as const,
  adminStocks: (params: AdminStockListParams = {}) => ['stocks', 'admin', params] as const,
  adminStock: (id: string) => ['stocks', 'admin', 'detail', id] as const,
};

// A stock's price/status only changes through an explicit admin action -
// same freshness window as useDepositQueries.ts's DEPOSIT_STALE_TIME_MS.
const STOCK_STALE_TIME_MS = 60 * 1000;

// Public, no authentication required (apps/server/src/modules/stock/stock.routes.ts
// carries no `authenticate` middleware) - same unconditional `useQuery` shape
// as useSettingsQueries.ts's public settings hooks, unlike
// useDepositQueries.ts's useDeposits, which gates on isAuthenticated.
export const useStocks = (
  params: StockListParams = {},
): UseQueryResult<PaginatedResponse<Stock>, Error> =>
  useQuery({
    queryKey: STOCK_QUERY_KEYS.stocks(params),
    queryFn: () => stockService.getStocks(params),
    staleTime: STOCK_STALE_TIME_MS,
  });

export const useStock = (id: string): UseQueryResult<Stock, Error> =>
  useQuery({
    queryKey: STOCK_QUERY_KEYS.stock(id),
    queryFn: () => stockService.getStockById(id),
    enabled: Boolean(id),
    staleTime: STOCK_STALE_TIME_MS,
  });

export const useFeaturedStocks = (): UseQueryResult<Stock[], Error> =>
  useQuery({
    queryKey: STOCK_QUERY_KEYS.featured,
    queryFn: stockService.getFeaturedStocks,
    staleTime: STOCK_STALE_TIME_MS,
  });

export const useStockCategories = (): UseQueryResult<string[], Error> =>
  useQuery({
    queryKey: STOCK_QUERY_KEYS.categories,
    queryFn: stockService.getStockCategories,
    staleTime: STOCK_STALE_TIME_MS,
  });

export const useStockHistory = (
  id: string,
  params: StockHistoryParams = {},
): UseQueryResult<PaginatedResponse<MarketHistory>, Error> =>
  useQuery({
    queryKey: STOCK_QUERY_KEYS.history(id, params),
    queryFn: () => stockService.getStockHistory(id, params),
    enabled: Boolean(id),
    staleTime: STOCK_STALE_TIME_MS,
  });

export const useAdminStocks = (
  params: AdminStockListParams = {},
): UseQueryResult<PaginatedResponse<Stock>, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: STOCK_QUERY_KEYS.adminStocks(params),
    queryFn: () => stockService.adminListStocks(params),
    enabled: isAuthenticated,
    staleTime: STOCK_STALE_TIME_MS,
  });
};

export const useAdminStock = (id: string): UseQueryResult<Stock, Error> => {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: STOCK_QUERY_KEYS.adminStock(id),
    queryFn: () => stockService.adminGetStockById(id),
    enabled: isAuthenticated && Boolean(id),
    staleTime: STOCK_STALE_TIME_MS,
  });
};
