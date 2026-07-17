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
// one shared implementation parameterized by `direction`. Extracted from
// mutateBalance (below) so the same atomic body can run either under a session
// this module opens and commits itself (the default, self-contained path every
// existing caller uses) or under a session an outer caller already opened and
// owns the commit/rollback of (tasks/phase-05.md's Deposit Approval Workflow:
// a wallet credit and a deposit status update must commit or roll back
// together, and MongoDB has no nested transactions, so only one party may ever
// drive session.withTransaction/commit/abort for a given session).
const mutateBalanceInSession = async (
  walletId: string,
  input: WalletMutationInput,
  direction: TransactionType,
  session: ClientSession,
): Promise<WalletMutationResult> => {
  assertPositiveAmount(input.amount);

  // Everything this operation depends on - the wallet's current balance/status,
  // the sufficient-balance check, and balanceBefore/balanceAfter - is read
  // *inside* the transaction rather than before it starts: a self-managed
  // session.withTransaction retries this whole function on a transient write
  // conflict, so a read taken beforehand would go stale across a retry and
  // could record an inaccurate balanceBefore/balanceAfter on the ledger even
  // though the wallet's real balance (updated via $inc) stays correct.
  const wallet = await getWalletForMutation(walletId, session);
  assertWalletIsActive(wallet);

  if (direction === TransactionType.DEBIT && wallet.availableBalance < input.amount) {
    throw new InsufficientBalanceError();
  }

  const signedAmount = direction === TransactionType.CREDIT ? input.amount : -input.amount;
  const balanceBefore = wallet.availableBalance;
  const balanceAfter = balanceBefore + signedAmount;

  const transactionNumber = await generateTransactionNumber(new Date(), session);

  const transaction = await transactionRepository.create(
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

  const updatedWallet = await walletRepository.updateBalance(
    wallet._id,
    { availableBalance: signedAmount, ...input.additionalBalanceEffects },
    session,
  );

  if (!updatedWallet) {
    throw new WalletNotFoundError();
  }

  return { wallet: updatedWallet, transaction };
};

// Concurrency safety for the sufficient-balance check comes entirely from
// re-reading the wallet inside the transaction and MongoDB's own write-conflict
// detection + withTransaction's automatic retry - NOT from wallet.model.ts's
// `min: 0` validator, which Mongoose does not evaluate against the resulting
// value on an $inc update (verified: it silently lets the value go negative
// even with runValidators: true). The only validation that can actually fail
// inside the transaction is transactionRepository.create()'s full-document
// validation (amount/balanceBefore/balanceAfter all carry `min: 0`,
// transaction.model.ts). Translating that here keeps a raw Mongoose error from
// ever reaching the global error handler (docs/22 - never expose database
// errors). Shared by mutateBalance and mutateBalanceWithSession's catch blocks
// below rather than duplicated in both.
const translateMongooseError = (error: unknown): Error => {
  if (error instanceof mongoose.Error.ValidationError) {
    return new BusinessRuleError(error.message);
  }

  return error instanceof Error ? error : new Error(String(error));
};

const mutateBalance = async (
  walletId: string,
  input: WalletMutationInput,
  direction: TransactionType,
): Promise<WalletMutationResult> => {
  const session = await mongoose.startSession();

  try {
    let result: WalletMutationResult | undefined;

    // backend_rules.md #9 - every financial operation must use a MongoDB
    // transaction.
    await session.withTransaction(async () => {
      result = await mutateBalanceInSession(walletId, input, direction, session);
    });

    if (!result) {
      throw new WalletNotFoundError();
    }

    // Emitted only after the transaction has committed (never inside the
    // withTransaction callback, which MongoDB may retry) - a listener must
    // never observe this event for a mutation that later rolled back.
    walletEvents.emit(direction === TransactionType.CREDIT ? 'WalletCredited' : 'WalletDebited', {
      walletId: result.wallet.id,
      userId: result.wallet.userId.toString(),
      amount: input.amount,
      category: input.category,
      transactionId: result.transaction.id,
    });

    return result;
  } catch (error) {
    throw translateMongooseError(error);
  } finally {
    await session.endSession();
  }
};

// Composes into a caller-owned transaction - the session's withTransaction/
// commit/abort belongs to the caller (e.g. DepositService.approveDeposit),
// which is responsible for re-reading and validating its own document (the
// deposit) inside that same session, exactly as mutateBalance does for the
// wallet above. Deliberately does NOT emit WalletCredited/WalletDebited: this
// function returns before the caller's own transaction commits, so emitting
// here could fire the event for a mutation the caller later rolls back (e.g.
// if the deposit status update fails after the credit succeeds). No listener
// currently subscribes to these events (docs 15's Notification module doesn't
// exist yet); once one does, the caller can emit after its own commit if this
// path needs to signal it too.
const mutateBalanceWithSession = async (
  walletId: string,
  input: WalletMutationInput,
  direction: TransactionType,
  session: ClientSession,
): Promise<WalletMutationResult> => {
  try {
    return await mutateBalanceInSession(walletId, input, direction, session);
  } catch (error) {
    throw translateMongooseError(error);
  }
};

export const credit = (
  walletId: string,
  input: WalletMutationInput,
  session?: ClientSession,
): Promise<WalletMutationResult> =>
  session
    ? mutateBalanceWithSession(walletId, input, TransactionType.CREDIT, session)
    : mutateBalance(walletId, input, TransactionType.CREDIT);

export const debit = (
  walletId: string,
  input: WalletMutationInput,
  session?: ClientSession,
): Promise<WalletMutationResult> =>
  session
    ? mutateBalanceWithSession(walletId, input, TransactionType.DEBIT, session)
    : mutateBalance(walletId, input, TransactionType.DEBIT);
