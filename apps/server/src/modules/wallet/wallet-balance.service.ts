import mongoose, { Types } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { TransactionStatus, TransactionType, WalletStatus } from 'shared-types';
import type { TransactionCategory } from 'shared-types';

import {
  BusinessRuleError,
  InsufficientBalanceError,
  WalletNotActiveError,
  WalletNotFoundError,
} from '@/shared/errors';

import { generateTransactionNumber } from './transaction-number.util';
import { transactionRepository } from './transaction.repository';
import type { TransactionDocument } from './transaction.types';
import { walletEvents } from './wallet.events';
import { walletRepository } from './wallet.repository';
import type { WalletBalanceField, WalletDocument } from './wallet.types';

// Split out of wallet.service.ts purely to keep both files under the 300-line
// Service limit (coding_rules.md #3) - credit/debit are still WalletService's
// core mutation engine, not a distinct domain concern (same rationale as
// users-guards.ts's split from users.service.ts). wallet.service.ts imports
// credit/debit from here and re-exports them under the same walletService
// object; this file deliberately does NOT import from wallet.service.ts (see
// getWalletForMutation below) so the two files stay a one-directional
// dependency rather than a cycle (backend_rules.md #19).

const assertPositiveAmount = (amount: number): void => {
  if (amount <= 0) {
    throw new BusinessRuleError('Amount must be greater than zero.');
  }
};

// tasks/phase-04.md - "Only ACTIVE wallets may perform financial operations."
const assertWalletIsActive = (wallet: WalletDocument): void => {
  if (wallet.status !== WalletStatus.ACTIVE) {
    throw new WalletNotActiveError();
  }
};

// Duplicates wallet.service.ts's getWallet on purpose: importing it from there
// would make wallet.service.ts and this file import each other (it imports
// credit/debit back from here), and backend_rules.md #19 says to avoid that
// circular dependency rather than share this four-line lookup.
const getWalletForMutation = async (
  walletId: string,
  session: ClientSession,
): Promise<WalletDocument> => {
  const wallet = await walletRepository.findById(walletId, session);

  if (!wallet) {
    throw new WalletNotFoundError();
  }

  return wallet;
};

export interface WalletMutationInput {
  category: TransactionCategory;
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  // The admin who performed the action, for ADMIN_ADJUSTMENT transactions.
  createdBy?: string;
  // Additional running totals to $inc alongside availableBalance in the same
  // atomic update - e.g. a future DepositService also bumping totalDeposited.
  // The caller decides which totals apply for its own category; WalletService
  // stays a generic primitive and never implements deposit/withdrawal/trading/
  // MLM logic itself (tasks/phase-04.md's stated scope boundary for this module).
  additionalBalanceEffects?: Partial<
    Record<Exclude<WalletBalanceField, 'availableBalance'>, number>
  >;
}

export interface WalletMutationResult {
  wallet: WalletDocument;
  transaction: TransactionDocument;
}

// tasks/phase-04.md's Credit/Debit Operation workflows are identical apart from
// the sign of the balance change and the sufficient-balance check, so both are
// one shared implementation parameterized by `direction`.
const mutateBalance = async (
  walletId: string,
  input: WalletMutationInput,
  direction: TransactionType,
): Promise<WalletMutationResult> => {
  assertPositiveAmount(input.amount);

  const session = await mongoose.startSession();

  try {
    let transaction: TransactionDocument | undefined;
    let updatedWallet: WalletDocument | undefined;
    let eventWalletId = '';
    let eventUserId = '';

    // backend_rules.md #9 - every financial operation (Wallet Adjustment is
    // explicitly listed) must use a MongoDB transaction. Everything this
    // operation depends on - the wallet's current balance/status, the
    // sufficient-balance check, and balanceBefore/balanceAfter - is read
    // *inside* this callback rather than before session.withTransaction is
    // called: withTransaction re-invokes the callback on a transient write
    // conflict, so a read taken beforehand would go stale across a retry and
    // could record an inaccurate balanceBefore/balanceAfter on the ledger even
    // though the wallet's real balance (updated via $inc) stays correct.
    await session.withTransaction(async () => {
      const wallet = await getWalletForMutation(walletId, session);
      assertWalletIsActive(wallet);

      if (direction === TransactionType.DEBIT && wallet.availableBalance < input.amount) {
        throw new InsufficientBalanceError();
      }

      const signedAmount = direction === TransactionType.CREDIT ? input.amount : -input.amount;
      const balanceBefore = wallet.availableBalance;
      const balanceAfter = balanceBefore + signedAmount;

      const transactionNumber = await generateTransactionNumber(new Date(), session);

      transaction = await transactionRepository.create(
        {
          transactionNumber,
          walletId: wallet._id,
          userId: wallet.userId,
          type: direction,
          category: input.category,
          amount: input.amount,
          balanceBefore,
          balanceAfter,
          currency: input.currency,
          status: TransactionStatus.COMPLETED,
          description: input.description,
          referenceId: input.referenceId,
          metadata: input.metadata,
          createdBy: input.createdBy ? new Types.ObjectId(input.createdBy) : undefined,
        },
        session,
      );

      updatedWallet =
        (await walletRepository.updateBalance(
          wallet._id,
          { availableBalance: signedAmount, ...input.additionalBalanceEffects },
          session,
        )) ?? undefined;

      eventWalletId = wallet.id;
      eventUserId = wallet.userId.toString();
    });

    if (!updatedWallet || !transaction) {
      throw new WalletNotFoundError();
    }

    walletEvents.emit(direction === TransactionType.CREDIT ? 'WalletCredited' : 'WalletDebited', {
      walletId: eventWalletId,
      userId: eventUserId,
      amount: input.amount,
      category: input.category,
      transactionId: transaction.id,
    });

    return { wallet: updatedWallet, transaction };
  } catch (error) {
    // Concurrency safety for the sufficient-balance check comes entirely from
    // re-reading the wallet inside the transaction above and MongoDB's own
    // write-conflict detection + withTransaction's automatic retry - NOT from
    // wallet.model.ts's `min: 0` validator, which Mongoose does not evaluate
    // against the resulting value on an $inc update (verified: it silently lets
    // the value go negative even with runValidators: true). The only
    // validation that can actually fail inside this transaction is
    // transactionRepository.create()'s full-document validation (amount/
    // balanceBefore/balanceAfter all carry `min: 0`, transaction.model.ts).
    // Translating that here keeps a raw Mongoose error from ever reaching the
    // global error handler (docs/22 - never expose database errors).
    if (error instanceof mongoose.Error.ValidationError) {
      throw new BusinessRuleError(error.message);
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export const credit = (
  walletId: string,
  input: WalletMutationInput,
): Promise<WalletMutationResult> => mutateBalance(walletId, input, TransactionType.CREDIT);

export const debit = (
  walletId: string,
  input: WalletMutationInput,
): Promise<WalletMutationResult> => mutateBalance(walletId, input, TransactionType.DEBIT);
