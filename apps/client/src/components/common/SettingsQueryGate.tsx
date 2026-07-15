import type { JSX, ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import ErrorState from '@/components/common/ErrorState';
import LoadingState from '@/components/common/LoadingState';

interface SettingsQueryGateProps<T> {
  readonly query: UseQueryResult<T, Error>;
  readonly children: (data: T) => ReactNode;
}

// Shared by every settings category page - keeps the loading/error handling for
// useXSettings() in one place instead of copy-pasted 10 times, same role as
// CurrentUserGate.tsx for useCurrentUser().
const SettingsQueryGate = <T,>({ query, children }: SettingsQueryGateProps<T>): JSX.Element => {
  const { data, isLoading, isError, refetch } = query;

  if (isLoading) {
    return <LoadingState message="Loading settings..." />;
  }

  if (isError || data === undefined) {
    return <ErrorState message="We couldn't load these settings." onRetry={() => void refetch()} />;
  }

  return <>{children(data)}</>;
};

export default SettingsQueryGate;
