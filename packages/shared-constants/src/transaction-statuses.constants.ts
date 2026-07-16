import { TransactionStatus } from 'shared-types';

export const TRANSACTION_STATUSES: readonly TransactionStatus[] = Object.values(
  TransactionStatus,
) as TransactionStatus[];
