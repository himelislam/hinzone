import type { TransactionCategory } from '../enums/transaction-category.enum';
import type { TransactionStatus } from '../enums/transaction-status.enum';
import type { TransactionType } from '../enums/transaction-type.enum';

// API-facing transaction shape (tasks/phase-04.md - Transaction Schema). Records
// are immutable after creation except for `status` transitioning between the
// values in TransactionStatus - historical amounts and balances never change.
export interface Transaction {
  id: string;
  transactionNumber: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  status: TransactionStatus;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
}
