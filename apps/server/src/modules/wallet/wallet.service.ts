import { Types } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { WalletStatus } from 'shared-types';
import type { WalletSummary } from 'shared-types';

import { NotFoundError, WalletNotFoundError } from '@/shared/errors';

import { transactionRepository } from './transaction.repository';
import type {
  PaginatedTransactions,
  TransactionDocument,
  TransactionFilters,
  TransactionListOptions,
} from './transaction.types';
import { credit, debit } from './wallet-balance.service';
import { walletEvents } from './wallet.events';
import { walletRepository } from './wallet.repository';
import type { WalletDocument } from './wallet.types';

// Idempotent (Task 11) - registration can safely call this more than once for
// the same user without creating a duplicate wallet, since the unique index on
// userId (wallet.model.ts) backs this check at the database level too.
const createWallet = async (
  userId: string,
  currency: string,
  session?: ClientSession,
): Promise<WalletDocument> => {
  const userObjectId = new Types.ObjectId(userId);
  const existing = await walletRepository.findByUserId(userObjectId, session);

  if (existing) {
    return existing;
  }

  return walletRepository.create({ userId: userObjectId, currency }, session);
};

const getWallet = async (walletId: string, session?: ClientSession): Promise<WalletDocument> => {
  const wallet = await walletRepository.findById(walletId, session);

  if (!wallet) {
    throw new WalletNotFoundError();
  }

  return wallet;
};

const getWalletByUser = async (userId: string): Promise<WalletDocument> => {
  const wallet = await walletRepository.findByUserId(new Types.ObjectId(userId));

  if (!wallet) {
    throw new WalletNotFoundError();
  }

  return wallet;
};

const setStatus = async (walletId: string, status: WalletStatus): Promise<WalletDocument> => {
  const updated = await walletRepository.updateStatus(new Types.ObjectId(walletId), status);

  if (!updated) {
    throw new WalletNotFoundError();
  }

  return updated;
};

const freeze = (walletId: string): Promise<WalletDocument> =>
  setStatus(walletId, WalletStatus.FROZEN);

const unfreeze = (walletId: string): Promise<WalletDocument> =>
  setStatus(walletId, WalletStatus.ACTIVE);

// Only lock/unlock emit events (tasks/phase-04.md's Wallet Events list names
// WalletLocked/WalletUnlocked, not freeze/unfreeze equivalents).
const lock = async (walletId: string): Promise<WalletDocument> => {
  const wallet = await setStatus(walletId, WalletStatus.LOCKED);
  walletEvents.emit('WalletLocked', { walletId: wallet.id, userId: wallet.userId.toString() });
  return wallet;
};

const unlock = async (walletId: string): Promise<WalletDocument> => {
  const wallet = await setStatus(walletId, WalletStatus.ACTIVE);
  walletEvents.emit('WalletUnlocked', { walletId: wallet.id, userId: wallet.userId.toString() });
  return wallet;
};

const calculateBalance = async (walletId: string): Promise<number> => {
  const wallet = await getWallet(walletId);
  return wallet.availableBalance;
};

const getWalletSummary = async (walletId: string): Promise<WalletSummary> => {
  const wallet = await getWallet(walletId);

  return {
    availableBalance: wallet.availableBalance,
    pendingBalance: wallet.pendingBalance,
    totalDeposited: wallet.totalDeposited,
    totalWithdrawn: wallet.totalWithdrawn,
    totalInvestment: wallet.totalInvestment,
    totalProfit: wallet.totalProfit,
  };
};

const getTransactionHistory = async (
  walletId: string,
  options: TransactionListOptions,
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> => {
  await getWallet(walletId);

  return transactionRepository.findByWalletId(new Types.ObjectId(walletId), options, filters);
};

// GET /api/v1/wallet/transactions/:id (Task D) - scoped to the caller's own
// wallet. A mismatched walletId reports NotFound rather than Forbidden, so a
// user probing another user's transaction ids can't distinguish "exists but
// isn't yours" from "doesn't exist" (same non-enumeration principle as
// auth.service.ts's login error).
const getTransaction = async (
  walletId: string,
  transactionId: string,
): Promise<TransactionDocument> => {
  const transaction = await transactionRepository.findById(transactionId);

  if (!transaction || transaction.walletId.toString() !== walletId) {
    throw new NotFoundError('Transaction not found.');
  }

  return transaction;
};

export const walletService = {
  createWallet,
  getWallet,
  getWalletByUser,
  credit,
  debit,
  freeze,
  unfreeze,
  lock,
  unlock,
  calculateBalance,
  getWalletSummary,
  getTransactionHistory,
  getTransaction,
};

export type { WalletMutationInput, WalletMutationResult } from './wallet-balance.service';
