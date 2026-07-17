import { DepositStatus } from 'shared-types';

export const DEPOSIT_STATUSES: readonly DepositStatus[] = Object.values(
  DepositStatus,
) as DepositStatus[];
