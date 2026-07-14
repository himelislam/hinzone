import type { JSX } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from 'shared-types';

import { useAuth } from '@/hooks/useAuth';

const ADMIN_ROLES: ReadonlySet<UserRole> = new Set([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

// Must be rendered nested inside <ProtectedRoute> (see routes/AppRoutes.tsx) -
// it relies on that guard for the authenticated-and-loaded guarantee and only
// adds the role check on top.
const AdminRoute = (): JSX.Element => {
  const { user } = useAuth();
  const isAdmin = user !== null && ADMIN_ROLES.has(user.role);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
