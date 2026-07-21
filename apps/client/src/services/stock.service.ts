import type { ApiSuccessResponse, MarketHistory, PaginatedResponse, Stock } from 'shared-types';

import { STOCK_ENDPOINTS } from '@/constants/stock-endpoints.constants';
import type {
  AdminStockListParams,
  ChangeStockStatusPayload,
  CreateStockPayload,
  StockHistoryParams,
  StockListParams,
  UpdateStockPayload,
  UpdateStockPricePayload,
} from '@/types/stock.types';

import { apiClient } from './api';

const getStocks = async (params: StockListParams = {}): Promise<PaginatedResponse<Stock>> => {
  const response = await apiClient.get<PaginatedResponse<Stock>>(STOCK_ENDPOINTS.STOCKS, {
    params,
  });

  return response.data;
};

const getFeaturedStocks = async (): Promise<Stock[]> => {
  const response = await apiClient.get<ApiSuccessResponse<Stock[]>>(STOCK_ENDPOINTS.STOCK_FEATURED);

  return response.data.data;
};

const getStockCategories = async (): Promise<string[]> => {
  const response = await apiClient.get<ApiSuccessResponse<string[]>>(
    STOCK_ENDPOINTS.STOCK_CATEGORIES,
  );

  return response.data.data;
};

const getStockById = async (id: string): Promise<Stock> => {
  const response = await apiClient.get<ApiSuccessResponse<Stock>>(STOCK_ENDPOINTS.STOCK_BY_ID(id));

  return response.data.data;
};

const getStockHistory = async (
  id: string,
  params: StockHistoryParams = {},
): Promise<PaginatedResponse<MarketHistory>> => {
  const response = await apiClient.get<PaginatedResponse<MarketHistory>>(
    STOCK_ENDPOINTS.STOCK_HISTORY(id),
    { params },
  );

  return response.data;
};

// Admin-only (enforced server-side by authenticate + authorize(ADMIN, SUPER_ADMIN),
// not here - see services/wallet.service.ts's adminListWallets for the same
// rationale, backend_rules.md #23 "never trust client-provided values").
const adminListStocks = async (
  params: AdminStockListParams = {},
): Promise<PaginatedResponse<Stock>> => {
  const response = await apiClient.get<PaginatedResponse<Stock>>(STOCK_ENDPOINTS.ADMIN_LIST, {
    params,
  });

  return response.data;
};

const adminGetStockById = async (id: string): Promise<Stock> => {
  const response = await apiClient.get<ApiSuccessResponse<Stock>>(STOCK_ENDPOINTS.ADMIN_BY_ID(id));

  return response.data.data;
};

// Shared by adminCreateStock/adminUpdateStock below - both endpoints are
// multipart/form-data (an optional logo file travels alongside the rest,
// stock.types.ts's CreateStockPayload/UpdateStockPayload), and both payloads
// have enough fields that hand-appending each one (deposit.service.ts's
// createDeposit's 4-field approach) would just be the same loop written out
// twice. `undefined` fields are skipped entirely - matching how an omitted
// optional field, not an empty string, is what stock.validation.ts's
// toNumberIfString/toBooleanIfString preprocessors expect on the other end.
const buildStockFormData = (payload: CreateStockPayload | UpdateStockPayload): FormData => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }

    formData.append(key, value instanceof File ? value : String(value));
  }

  return formData;
};

const adminCreateStock = async (payload: CreateStockPayload): Promise<Stock> => {
  const response = await apiClient.post<ApiSuccessResponse<Stock>>(
    STOCK_ENDPOINTS.ADMIN_CREATE,
    buildStockFormData(payload),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data;
};

const adminUpdateStock = async (id: string, payload: UpdateStockPayload): Promise<Stock> => {
  const response = await apiClient.put<ApiSuccessResponse<Stock>>(
    STOCK_ENDPOINTS.ADMIN_UPDATE(id),
    buildStockFormData(payload),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data;
};

const adminChangeStockStatus = async (
  id: string,
  payload: ChangeStockStatusPayload,
): Promise<Stock> => {
  const response = await apiClient.patch<ApiSuccessResponse<Stock>>(
    STOCK_ENDPOINTS.ADMIN_CHANGE_STATUS(id),
    payload,
  );

  return response.data.data;
};

const adminUpdateStockPrice = async (
  id: string,
  payload: UpdateStockPricePayload,
): Promise<Stock> => {
  const response = await apiClient.patch<ApiSuccessResponse<Stock>>(
    STOCK_ENDPOINTS.ADMIN_UPDATE_PRICE(id),
    payload,
  );

  return response.data.data;
};

const adminDeleteStock = async (id: string): Promise<Stock> => {
  const response = await apiClient.delete<ApiSuccessResponse<Stock>>(
    STOCK_ENDPOINTS.ADMIN_DELETE(id),
  );

  return response.data.data;
};

export const stockService = {
  getStocks,
  getFeaturedStocks,
  getStockCategories,
  getStockById,
  getStockHistory,
  adminListStocks,
  adminGetStockById,
  adminCreateStock,
  adminUpdateStock,
  adminChangeStockStatus,
  adminUpdateStockPrice,
  adminDeleteStock,
};
