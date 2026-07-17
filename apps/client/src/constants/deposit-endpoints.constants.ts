// Relative to VITE_API_URL - see wallet-endpoints.constants.ts for the same
// convention. ADMIN_* routes require ADMIN/SUPER_ADMIN, enforced server-side
// (authenticate + authorize).
export const DEPOSIT_ENDPOINTS = {
  DEPOSITS: '/deposits',
  DEPOSIT_BY_ID: (id: string): string => `/deposits/${id}`,
  ADMIN_LIST: '/admin/deposits',
  ADMIN_BY_ID: (id: string): string => `/admin/deposits/${id}`,
  ADMIN_APPROVE: (id: string): string => `/admin/deposits/${id}/approve`,
  ADMIN_REJECT: (id: string): string => `/admin/deposits/${id}/reject`,
} as const;
