import type {
  ApiSuccessResponse,
  PaginatedResponse,
  Transaction,
  Wallet,
  WalletSummary,
} from 'shared-types';

import { WALLET_ENDPOINTS } from '@/constants/wallet-endpoints.constants';
import type {
  AdjustWalletPayload,
  AdjustWalletResult,
  AdminWalletListParams,
  TransactionListParams,
} from '@/types/wallet.types';

import { apiClient } from './api';

const getWallet = async (): Promise<Wallet> => {
  const response = await apiClient.get<ApiSuccessResponse<Wallet>>(WALLET_ENDPOINTS.WALLET);

  return response.data.data;
};

const getWalletSummary = async (): Promise<WalletSummary> => {
  const response = await apiClient.get<ApiSuccessResponse<WalletSummary>>(WALLET_ENDPOINTS.SUMMARY);

  return response.data.data;
};

const getTransactions = async (
  params: TransactionListParams = {},
): Promise<PaginatedResponse<Transaction>> => {
  const response = await apiClient.get<PaginatedResponse<Transaction>>(
    WALLET_ENDPOINTS.TRANSACTIONS,
    { params },
  );

  return response.data;
};

const getTransactionById = async (id: string): Promise<Transaction> => {
  const response = await apiClient.get<ApiSuccessResponse<Transaction>>(
    WALLET_ENDPOINTS.TRANSACTION_BY_ID(id),
  );

  return response.data.data;
};

// Admin-only (enforced server-side by authenticate + authorize(ADMIN, SUPER_ADMIN),
// not here - see services/settings.service.ts's updateSettings for the same
// rationale, backend_rules.md #23 "never trust client-provided values").
const adminListWallets = async (
  params: AdminWalletListParams = {},
): Promise<PaginatedResponse<Wallet>> => {
  const response = await apiClient.get<PaginatedResponse<Wallet>>(WALLET_ENDPOINTS.ADMIN_LIST, {
    params,
  });

  return response.data;
};

const adminGetWalletById = async (id: string): Promise<Wallet> => {
  const response = await apiClient.get<ApiSuccessResponse<Wallet>>(
    WALLET_ENDPOINTS.ADMIN_BY_ID(id),
  );

  return response.data.data;
};

const adminGetWalletByUserId = async (userId: string): Promise<Wallet> => {
  const response = await apiClient.get<ApiSuccessResponse<Wallet>>(
    WALLET_ENDPOINTS.ADMIN_BY_USER_ID(userId),
  );

  return response.data.data;
};

const adminAdjustWallet = async (
  id: string,
  payload: AdjustWalletPayload,
): Promise<AdjustWalletResult> => {
  const response = await apiClient.post<ApiSuccessResponse<AdjustWalletResult>>(
    WALLET_ENDPOINTS.ADMIN_ADJUST(id),
    payload,
  );

  return response.data.data;
};

export const walletService = {
  getWallet,
  getWalletSummary,
  getTransactions,
  getTransactionById,
  adminListWallets,
  adminGetWalletById,
  adminGetWalletByUserId,
  adminAdjustWallet,
};
