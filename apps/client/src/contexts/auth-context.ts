import { createContext } from 'react';
import type { User } from 'shared-types';

export interface AuthContextValue {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly setAuthenticatedUser: (user: User) => void;
  readonly clearAuth: () => void;
}

// Split from AuthProvider.tsx so that file only exports a component - keeps React
// Fast Refresh working there (react-refresh/only-export-components).
export const AuthContext = createContext<AuthContextValue | null>(null);
