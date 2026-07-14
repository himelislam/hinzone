import { AccountStatus } from 'shared-types';

export const ACCOUNT_STATUSES: readonly AccountStatus[] = Object.values(
  AccountStatus,
) as AccountStatus[];
