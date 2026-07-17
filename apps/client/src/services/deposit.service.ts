import type { ApiSuccessResponse, Deposit, PaginatedResponse } from 'shared-types';

import { DEPOSIT_ENDPOINTS } from '@/constants/deposit-endpoints.constants';
import type {
  CreateDepositPayload,
  DepositListParams,
  RejectDepositPayload,
} from '@/types/deposit.types';

import { apiClient } from './api';

// Multipart form data - this endpoint carries the screenshot file alongside the
// other fields, same pattern as usersService.uploadProfileImage.
const createDeposit = async (payload: CreateDepositPayload): Promise<Deposit> => {
  const formData = new FormData();
  formData.append('packageAmount', String(payload.packageAmount));
  formData.append('paymentMethod', payload.paymentMethod);
  formData.append('senderAccountNumber', payload.senderAccountNumber);
  formData.append('paymentReference', payload.paymentReference);
  formData.append('screenshot', payload.screenshot);

  const response = await apiClient.post<ApiSuccessResponse<Deposit>>(
    DEPOSIT_ENDPOINTS.DEPOSITS,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.data;
};

const getDeposits = async (params: DepositListParams = {}): Promise<PaginatedResponse<Deposit>> => {
  const response = await apiClient.get<PaginatedResponse<Deposit>>(DEPOSIT_ENDPOINTS.DEPOSITS, {
    params,
  });

  return response.data;
};

const getDepositById = async (id: string): Promise<Deposit> => {
  const response = await apiClient.get<ApiSuccessResponse<Deposit>>(
    DEPOSIT_ENDPOINTS.DEPOSIT_BY_ID(id),
  );

  return response.data.data;
};

const cancelDeposit = async (id: string): Promise<Deposit> => {
  const response = await apiClient.delete<ApiSuccessResponse<Deposit>>(
    DEPOSIT_ENDPOINTS.DEPOSIT_BY_ID(id),
  );

  return response.data.data;
};

// Admin-only (enforced server-side by authenticate + authorize(ADMIN, SUPER_ADMIN),
// not here - see services/wallet.service.ts's adminListWallets for the same
// rationale, backend_rules.md #23 "never trust client-provided values").
const adminListDeposits = async (
  params: DepositListParams = {},
): Promise<PaginatedResponse<Deposit>> => {
  const response = await apiClient.get<PaginatedResponse<Deposit>>(DEPOSIT_ENDPOINTS.ADMIN_LIST, {
    params,
  });

  return response.data;
};

const adminGetDepositById = async (id: string): Promise<Deposit> => {
  const response = await apiClient.get<ApiSuccessResponse<Deposit>>(
    DEPOSIT_ENDPOINTS.ADMIN_BY_ID(id),
  );

  return response.data.data;
};

const adminApproveDeposit = async (id: string): Promise<Deposit> => {
  const response = await apiClient.patch<ApiSuccessResponse<Deposit>>(
    DEPOSIT_ENDPOINTS.ADMIN_APPROVE(id),
  );

  return response.data.data;
};

const adminRejectDeposit = async (id: string, payload: RejectDepositPayload): Promise<Deposit> => {
  const response = await apiClient.patch<ApiSuccessResponse<Deposit>>(
    DEPOSIT_ENDPOINTS.ADMIN_REJECT(id),
    payload,
  );

  return response.data.data;
};

export const depositService = {
  createDeposit,
  getDeposits,
  getDepositById,
  cancelDeposit,
  adminListDeposits,
  adminGetDepositById,
  adminApproveDeposit,
  adminRejectDeposit,
};
