import { TransactionCategory } from 'shared-types';

export const TRANSACTION_CATEGORIES: readonly TransactionCategory[] = Object.values(
  TransactionCategory,
) as TransactionCategory[];
