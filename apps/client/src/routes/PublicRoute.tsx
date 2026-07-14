import type { JSX } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import LoadingState from '@/components/common/LoadingState';
import { useAuth } from '@/hooks/useAuth';

// Guards routes like /login and /register that only make sense for a signed-out
// visitor - an already-authenticated user landing here is sent to their dashboard
// instead of being shown the form again.
const PublicRoute = (): JSX.Element => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Checking your session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
