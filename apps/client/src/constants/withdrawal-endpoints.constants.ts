// Relative to VITE_API_URL - see wallet-endpoints.constants.ts for the same
// convention. ADMIN_* routes require ADMIN/SUPER_ADMIN, enforced server-side
// (authenticate + authorize).
export const WITHDRAWAL_ENDPOINTS = {
  WITHDRAWALS: '/withdrawals',
  WITHDRAWAL_BY_ID: (id: string): string => `/withdrawals/${id}`,
  ADMIN_LIST: '/admin/withdrawals',
  ADMIN_BY_ID: (id: string): string => `/admin/withdrawals/${id}`,
  ADMIN_APPROVE: (id: string): string => `/admin/withdrawals/${id}/approve`,
  ADMIN_REJECT: (id: string): string => `/admin/withdrawals/${id}/reject`,
  ADMIN_PROCESSING: (id: string): string => `/admin/withdrawals/${id}/processing`,
  ADMIN_COMPLETE: (id: string): string => `/admin/withdrawals/${id}/complete`,
} as const;
