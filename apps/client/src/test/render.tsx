import type { JSX, ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '@/contexts/AuthProvider';

// A fresh, retry-disabled QueryClient per render call - retries would otherwise
// make failed-mutation tests slow (and occasionally flaky) waiting out backoff
// delays that only make sense against a real network.
const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  readonly initialEntries?: string[];
}

// Wraps a component with the same provider stack App.tsx sets up
// (QueryClientProvider, AuthProvider, a router) so hooks like useAuth() and
// useLogin() work exactly as they do in the real app, without needing a real
// backend - tests mock services/*.service.ts instead.
export const renderWithProviders = (
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: RenderWithProvidersOptions = {},
): RenderResult => {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
