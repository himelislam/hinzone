import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountStatus, UserRole } from 'shared-types';
import type { User } from 'shared-types';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { render, screen } from '@/test/render';

import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';

vi.mock('@/hooks/useAuth');

const mockedUseAuth = vi.mocked(useAuth);

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  fullName: 'Test User',
  username: 'testuser',
  phoneNumber: '01712345678',
  role: UserRole.USER,
  status: AccountStatus.ACTIVE,
  referralId: 'REF100001',
  isVerified: false,
  loginAttempts: 0,
  accountLockedUntil: null,
  joinDate: '2026-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const renderProtectedRouteAt = (initialEntry: string): void => {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProtectedRoute', () => {
  it('shows a loading state while the session is still restoring', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderProtectedRouteAt('/dashboard');

    expect(screen.getByText(/checking your session/i)).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderProtectedRouteAt('/dashboard');

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: buildUser(),
      isAuthenticated: true,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderProtectedRouteAt('/dashboard');

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  const renderPublicRouteAt = (initialEntry: string): void => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login form</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders the public content when not authenticated', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderPublicRouteAt('/login');

    expect(screen.getByText('Login form')).toBeInTheDocument();
  });

  it('redirects an already-authenticated user away to /dashboard', () => {
    mockedUseAuth.mockReturnValue({
      user: buildUser(),
      isAuthenticated: true,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderPublicRouteAt('/login');

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('Login form')).not.toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  const renderAdminRouteAt = (initialEntry: string): void => {
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin content</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders the admin content for an ADMIN user', () => {
    mockedUseAuth.mockReturnValue({
      user: buildUser({ role: UserRole.ADMIN }),
      isAuthenticated: true,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderAdminRouteAt('/admin');

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('renders the admin content for a SUPER_ADMIN user', () => {
    mockedUseAuth.mockReturnValue({
      user: buildUser({ role: UserRole.SUPER_ADMIN }),
      isAuthenticated: true,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderAdminRouteAt('/admin');

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('redirects a regular USER away to /dashboard', () => {
    mockedUseAuth.mockReturnValue({
      user: buildUser({ role: UserRole.USER }),
      isAuthenticated: true,
      isLoading: false,
      setAuthenticatedUser: vi.fn(),
      clearAuth: vi.fn(),
    });

    renderAdminRouteAt('/admin');

    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });
});
