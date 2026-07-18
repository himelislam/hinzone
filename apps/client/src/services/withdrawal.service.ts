import type { ApiSuccessResponse, PaginatedResponse, Withdrawal } from 'shared-types';

import { WITHDRAWAL_ENDPOINTS } from '@/constants/withdrawal-endpoints.constants';
import type {
  CreateWithdrawalPayload,
  RejectWithdrawalPayload,
  WithdrawalListParams,
} from '@/types/withdrawal.types';

import { apiClient } from './api';

// Plain JSON POST - unlike deposit.service.ts's createDeposit, this endpoint
// carries no file, so no FormData/multipart handling is needed.
const createWithdrawal = async (payload: CreateWithdrawalPayload): Promise<Withdrawal> => {
  const response = await apiClient.post<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.WITHDRAWALS,
    payload,
  );

  return response.data.data;
};

const getWithdrawals = async (
  params: WithdrawalListParams = {},
): Promise<PaginatedResponse<Withdrawal>> => {
  const response = await apiClient.get<PaginatedResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.WITHDRAWALS,
    { params },
  );

  return response.data;
};

const getWithdrawalById = async (id: string): Promise<Withdrawal> => {
  const response = await apiClient.get<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.WITHDRAWAL_BY_ID(id),
  );

  return response.data.data;
};

const cancelWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await apiClient.delete<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.WITHDRAWAL_BY_ID(id),
  );

  return response.data.data;
};

// Admin-only (enforced server-side by authenticate + authorize(ADMIN, SUPER_ADMIN),
// not here - see services/wallet.service.ts's adminListWallets for the same
// rationale, backend_rules.md #23 "never trust client-provided values").
const adminListWithdrawals = async (
  params: WithdrawalListParams = {},
): Promise<PaginatedResponse<Withdrawal>> => {
  const response = await apiClient.get<PaginatedResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.ADMIN_LIST,
    { params },
  );

  return response.data;
};

const adminGetWithdrawalById = async (id: string): Promise<Withdrawal> => {
  const response = await apiClient.get<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.ADMIN_BY_ID(id),
  );

  return response.data.data;
};

const adminApproveWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await apiClient.patch<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.ADMIN_APPROVE(id),
  );

  return response.data.data;
};

const adminRejectWithdrawal = async (
  id: string,
  payload: RejectWithdrawalPayload,
): Promise<Withdrawal> => {
  const response = await apiClient.patch<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.ADMIN_REJECT(id),
    payload,
  );

  return response.data.data;
};

const adminMarkProcessing = async (id: string): Promise<Withdrawal> => {
  const response = await apiClient.patch<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.ADMIN_PROCESSING(id),
  );

  return response.data.data;
};

const adminCompleteWithdrawal = async (id: string): Promise<Withdrawal> => {
  const response = await apiClient.patch<ApiSuccessResponse<Withdrawal>>(
    WITHDRAWAL_ENDPOINTS.ADMIN_COMPLETE(id),
  );

  return response.data.data;
};

export const withdrawalService = {
  createWithdrawal,
  getWithdrawals,
  getWithdrawalById,
  cancelWithdrawal,
  adminListWithdrawals,
  adminGetWithdrawalById,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
  adminMarkProcessing,
  adminCompleteWithdrawal,
};
