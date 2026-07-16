import { TransactionType } from 'shared-types';

export const TRANSACTION_TYPES: readonly TransactionType[] = Object.values(
  TransactionType,
) as TransactionType[];
