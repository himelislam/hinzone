// Relative to VITE_API_URL - see auth-endpoints.constants.ts for the same
// convention. ADMIN_* routes require ADMIN/SUPER_ADMIN, enforced server-side
// (authenticate + authorize) - same rationale as settings-endpoints.constants.ts
// mixing public and ADMIN_UPDATE routes in one object.
export const WALLET_ENDPOINTS = {
  WALLET: '/wallet',
  SUMMARY: '/wallet/summary',
  TRANSACTIONS: '/wallet/transactions',
  TRANSACTION_BY_ID: (id: string): string => `/wallet/transactions/${id}`,
  ADMIN_LIST: '/admin/wallets',
  ADMIN_BY_ID: (id: string): string => `/admin/wallets/${id}`,
  ADMIN_BY_USER_ID: (userId: string): string => `/admin/wallets/user/${userId}`,
  ADMIN_ADJUST: (id: string): string => `/admin/wallets/${id}/adjust`,
} as const;
