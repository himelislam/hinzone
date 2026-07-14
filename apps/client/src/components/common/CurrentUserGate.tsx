import type { JSX, ReactNode } from 'react';
import type { User } from 'shared-types';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';
import { useCurrentUser } from '@/hooks/useAuthMutations';

interface CurrentUserGateProps {
  readonly children: (user: User) => ReactNode;
}

// Shared by every page that needs the current user loaded before it can render
// anything (profile view/edit, ...) - keeps the loading/error handling for
// useCurrentUser() in one place instead of copy-pasted per page.
const CurrentUserGate = ({ children }: CurrentUserGateProps): JSX.Element => {
  const { data: user, isLoading, isError, refetch } = useCurrentUser();

  if (isLoading) {
    return <LoadingState message="Loading your profile..." />;
  }

  if (isError || !user) {
    return <ErrorState message="We couldn't load your profile." onRetry={() => void refetch()} />;
  }

  return <>{children(user)}</>;
};

export default CurrentUserGate;
