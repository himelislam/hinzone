import type { WithdrawalSettings } from 'shared-types';
import { WalletStatus, WithdrawalStatus } from 'shared-types';

import {
  BusinessRuleError,
  WalletNotActiveError,
  WithdrawalInvalidTransitionError,
} from '@/shared/errors';

import type { DepositDocument } from '../deposit/deposit.types';
import type { WalletDocument } from '../wallet/wallet.types';

import type { WithdrawalDocument } from './withdrawal.types';

// tasks/phase-06.md's Withdrawal Validation section - checked before a
// withdrawal is created or transitioned. Cross-field/business rules live
// here; structural validation (is this even a positive number, etc.)
// belongs to withdrawal.validation.ts's Zod schemas instead
// (database_rules.md #18: business rule validation belongs in the service
// layer, not the schema) - same split as deposit/deposit-business-rules.ts.

export const assertWithdrawalsEnabled = (settings: WithdrawalSettings): void => {
  if (!settings.enabled) {
    throw new BusinessRuleError('Withdrawals are currently disabled.');
  }
};

export const assertAmountWithinLimits = (amount: number, settings: WithdrawalSettings): void => {
  if (amount < settings.minimumWithdrawal || amount > settings.maximumWithdrawal) {
    throw new BusinessRuleError(
      `Withdrawal amount must be between ${settings.minimumWithdrawal} and ${settings.maximumWithdrawal}.`,
    );
  }
};

export const assertPaymentMethodAllowed = (method: string, settings: WithdrawalSettings): void => {
  if (!settings.paymentMethods.includes(method)) {
    throw new BusinessRuleError('Selected payment method is not available.');
  }
};

// tasks/phase-06.md's Withdrawal Validation - "Wallet Status" - a withdrawal
// request must never be accepted against a FROZEN/LOCKED wallet, even though
// the same status is re-checked again at completion time inside
// WalletService.debit's own transaction (wallet-balance.service.ts's
// assertWalletIsActive). Reuses the same WalletNotActiveError the wallet
// module already throws for this condition, rather than a second error type
// for the identical failure.
export const assertWalletIsActive = (wallet: WalletDocument): void => {
  if (wallet.status !== WalletStatus.ACTIVE) {
    throw new WalletNotActiveError();
  }
};

// docs/10-withdraw-module.md #10 - only available wallet balance may be
// withdrawn. This is a fast pre-check for a clear rejection message at
// request time; the check that actually gates money movement lives inside
// WalletService.debit's own transaction at completion time, since the
// balance can legitimately move between request and completion.
export const assertSufficientBalance = (amount: number, wallet: WalletDocument): void => {
  if (wallet.availableBalance < amount) {
    throw new BusinessRuleError('Insufficient wallet balance for this withdrawal.');
  }
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// tasks/phase-06.md's Waiting Period Validation: Current Date -> Latest
// Eligible Deposit -> Configured Waiting Period -> Withdrawal Allowed? A pure
// boolean predicate, exported separately from the throwing assert below, so
// the admin approval screen (tasks/phase-06.md's Admin Approval Screen
// "Waiting Period Validation Result") can display the same eligibility
// result computed here instead of duplicating this arithmetic a second time.
export const isWaitingPeriodSatisfied = (
  firstApprovedDeposit: DepositDocument | null,
  settings: WithdrawalSettings,
  now: Date = new Date(),
): boolean => {
  if (!firstApprovedDeposit) {
    return false;
  }

  const elapsedDays = Math.floor(
    (now.getTime() - firstApprovedDeposit.createdAt.getTime()) / MS_PER_DAY,
  );

  return elapsedDays >= settings.waitingPeriodDays;
};

// `firstApprovedDeposit` is null when the user has never had an approved
// deposit - withdrawal eligibility can never begin without one.
export const assertWaitingPeriodSatisfied = (
  firstApprovedDeposit: DepositDocument | null,
  settings: WithdrawalSettings,
  now: Date = new Date(),
): void => {
  if (!firstApprovedDeposit) {
    throw new BusinessRuleError(
      'An approved deposit is required before withdrawals become eligible.',
    );
  }

  if (!isWaitingPeriodSatisfied(firstApprovedDeposit, settings, now)) {
    const elapsedDays = Math.floor(
      (now.getTime() - firstApprovedDeposit.createdAt.getTime()) / MS_PER_DAY,
    );
    const remainingDays = settings.waitingPeriodDays - elapsedDays;
    throw new BusinessRuleError(
      `Withdrawals are not yet available for this account. ${remainingDays} day(s) remaining before the waiting period ends.`,
    );
  }
};

// Exported alongside their matching assert* guard below so the DB-level
// atomic conditional update (withdrawal.repository.ts's updateStatus, which
// takes the same status list as a query filter to close a TOCTOU race
// between this in-memory check and the write - see withdrawal-review.service.ts's
// applyTransition) checks the exact same status set the guard already
// validated, rather than each caller maintaining its own separately-written
// copy that could silently drift out of sync with the guard.
export const PENDING_STATUSES = [WithdrawalStatus.PENDING] as const;
export const PROCESSING_ELIGIBLE_STATUSES = [WithdrawalStatus.APPROVED] as const;
export const COMPLETABLE_STATUSES = [
  WithdrawalStatus.APPROVED,
  WithdrawalStatus.PROCESSING,
] as const;

// Shared by every transition guard below - each one only differs in which
// status(es) it accepts and its rejection message, so that's the only thing
// each guard passes in rather than repeating the same "compare status, throw"
// shape three times.
const assertStatusIn = (
  withdrawal: WithdrawalDocument,
  allowedStatuses: readonly WithdrawalStatus[],
  message: string,
): void => {
  if (!allowedStatuses.includes(withdrawal.status)) {
    throw new WithdrawalInvalidTransitionError(message);
  }
};

// Shared guard for cancel/approve/reject - none of those transitions are
// valid once a withdrawal has left PENDING.
export const assertIsPending = (withdrawal: WithdrawalDocument): void => {
  assertStatusIn(
    withdrawal,
    PENDING_STATUSES,
    'This withdrawal has already been reviewed and can no longer be changed.',
  );
};

// Guard for markProcessing - only an APPROVED withdrawal can move to
// PROCESSING (tasks/phase-06.md's "Processing Workflow").
export const assertCanMoveToProcessing = (withdrawal: WithdrawalDocument): void => {
  assertStatusIn(
    withdrawal,
    PROCESSING_ELIGIBLE_STATUSES,
    'Only an approved withdrawal can be moved to processing.',
  );
};

// Guard for completeWithdrawal - the one transition that actually debits the
// wallet (tasks/breakdown/phase-06-tasks.md's "decision 1"). Valid from
// either APPROVED or PROCESSING, matching phase-06.md's framing of
// PROCESSING as an optional intermediate step rather than a required one.
export const assertCanComplete = (withdrawal: WithdrawalDocument): void => {
  assertStatusIn(
    withdrawal,
    COMPLETABLE_STATUSES,
    'Only an approved or processing withdrawal can be completed.',
  );
};
