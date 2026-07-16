import type { Transaction, Wallet } from 'shared-types';

import type { TransactionDocument } from './transaction.types';
import type { WalletDocument } from './wallet.types';

// Maps the internal Mongoose document to the exact client-safe shape shared with
// the frontend (id vs _id, ISO date strings vs Date objects, userId as a string) -
// same rationale as users.dto.ts's toUserResponse.
export const toWalletResponse = (wallet: WalletDocument): Wallet => ({
  id: wallet.id,
  userId: wallet.userId.toString(),
  availableBalance: wallet.availableBalance,
  pendingBalance: wallet.pendingBalance,
  totalDeposited: wallet.totalDeposited,
  totalWithdrawn: wallet.totalWithdrawn,
  totalProfit: wallet.totalProfit,
  totalInvestment: wallet.totalInvestment,
  currency: wallet.currency,
  status: wallet.status,
  createdAt: wallet.createdAt.toISOString(),
  updatedAt: wallet.updatedAt.toISOString(),
});

export const toTransactionResponse = (transaction: TransactionDocument): Transaction => ({
  id: transaction.id,
  transactionNumber: transaction.transactionNumber,
  walletId: transaction.walletId.toString(),
  userId: transaction.userId.toString(),
  type: transaction.type,
  category: transaction.category,
  amount: transaction.amount,
  balanceBefore: transaction.balanceBefore,
  balanceAfter: transaction.balanceAfter,
  currency: transaction.currency,
  status: transaction.status,
  description: transaction.description,
  referenceId: transaction.referenceId,
  metadata: transaction.metadata,
  createdBy: transaction.createdBy?.toString(),
  createdAt: transaction.createdAt.toISOString(),
});
