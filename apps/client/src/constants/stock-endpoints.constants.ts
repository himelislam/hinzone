// Relative to VITE_API_URL - see wallet-endpoints.constants.ts for the same
// convention. ADMIN_* routes require ADMIN/SUPER_ADMIN, enforced server-side
// (authenticate + authorize). Every other route here is public/unauthenticated
// (apps/server/src/modules/stock/stock.routes.ts - phase-07.md's Security
// section: "Public users may only view active stocks," not "must be logged
// in to view stocks").
export const STOCK_ENDPOINTS = {
  STOCKS: '/stocks',
  STOCK_BY_ID: (id: string): string => `/stocks/${id}`,
  STOCK_FEATURED: '/stocks/featured',
  STOCK_CATEGORIES: '/stocks/categories',
  STOCK_HISTORY: (id: string): string => `/stocks/${id}/history`,
  ADMIN_LIST: '/admin/stocks',
  ADMIN_BY_ID: (id: string): string => `/admin/stocks/${id}`,
  ADMIN_CREATE: '/admin/stocks',
  ADMIN_UPDATE: (id: string): string => `/admin/stocks/${id}`,
  ADMIN_CHANGE_STATUS: (id: string): string => `/admin/stocks/${id}/status`,
  ADMIN_UPDATE_PRICE: (id: string): string => `/admin/stocks/${id}/price`,
  ADMIN_DELETE: (id: string): string => `/admin/stocks/${id}`,
} as const;
