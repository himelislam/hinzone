import { QueryClient } from '@tanstack/react-query';

export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 401s are already handled by apiClient's refresh-and-retry interceptor
      // (services/api.ts); a query that still fails after that has a real error,
      // not a transient one, so retrying it again here would just delay the
      // failure being shown.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
