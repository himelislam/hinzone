import { WithdrawalStatus } from 'shared-types';

export const WITHDRAWAL_STATUSES: readonly WithdrawalStatus[] = Object.values(
  WithdrawalStatus,
) as WithdrawalStatus[];
