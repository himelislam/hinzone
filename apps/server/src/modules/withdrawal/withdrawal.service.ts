import { Types } from 'mongoose';
import { WithdrawalStatus } from 'shared-types';

import { WithdrawalInvalidTransitionError, WithdrawalNotFoundError } from '@/shared/errors';

import { depositRepository } from '../deposit/deposit.repository';
import { settingsService } from '../settings/settings.service';
import { walletService } from '../wallet/wallet.service';

import {
  assertAmountWithinLimits,
  assertIsPending,
  assertPaymentMethodAllowed,
  assertSufficientBalance,
  assertWaitingPeriodSatisfied,
  assertWalletIsActive,
  assertWithdrawalsEnabled,
  isWaitingPeriodSatisfied,
  PENDING_STATUSES,
} from './withdrawal-business-rules';
import { calculateWithdrawalFee } from './withdrawal-fee.util';
import { generateWithdrawalNumber } from './withdrawal-number.util';
import {
  approveWithdrawal,
  completeWithdrawal,
  markProcessing,
  rejectWithdrawal,
} from './withdrawal-review.service';
import { withdrawalRepository } from './withdrawal.repository';
import type {
  PaginatedWithdrawals,
  WithdrawalDocument,
  WithdrawalFilters,
  WithdrawalListOptions,
} from './withdrawal.types';

// Mirrors deposit.service.ts's CreateDepositRequest precedent: the service
// layer declares its own request shape rather than importing
// withdrawal.validation.ts's Zod-inferred type (backend_rules.md's layering
// keeps validation depending on nothing below it, not the reverse) - the
// controller (a later task) casts its validated req.body to this
// structurally-compatible shape.
export interface CreateWithdrawalRequest {
  amount: number;
  paymentMethod: string;
  receiverAccountNumber: string;
  accountHolderName: string;
}

// tasks/phase-06.md's Create Withdrawal Request workflow: Validate Settings ->
// Validate Wallet -> Validate Waiting Period -> Calculate Fee -> Create
// Withdrawal (status PENDING) -> Notify Admin. Wallet balance is untouched -
// only completeWithdrawal (withdrawal-review.service.ts) ever debits it
// (this module's "decision 1", tasks/breakdown/phase-06-tasks.md).
const createWithdrawal = async (
  userId: string,
  input: CreateWithdrawalRequest,
): Promise<WithdrawalDocument> => {
  const settings = await settingsService.getWithdrawal();

  assertWithdrawalsEnabled(settings);
  assertAmountWithinLimits(input.amount, settings);
  assertPaymentMethodAllowed(input.paymentMethod, settings);

  // Independent reads - neither depends on the other's result - run
  // concurrently. The assertions below still run in the same order as
  // before (balance, then waiting period), so error precedence when both
  // would fail is unchanged; only the two round-trips themselves overlap.
  const [wallet, firstApprovedDeposit] = await Promise.all([
    walletService.getWalletByUser(userId),
    depositRepository.findEarliestApprovedByUserId(new Types.ObjectId(userId)),
  ]);

  // tasks/phase-06.md's Withdrawal Validation - "Wallet Status" - checked in
  // the same order the doc lists it (before Sufficient Balance).
  assertWalletIsActive(wallet);
  assertSufficientBalance(input.amount, wallet);
  assertWaitingPeriodSatisfied(firstApprovedDeposit, settings);

  const { fee, netAmount } = calculateWithdrawalFee(input.amount, settings.withdrawalFeePercentage);
  const withdrawalNumber = await generateWithdrawalNumber();

  return withdrawalRepository.create({
    withdrawalNumber,
    userId: new Types.ObjectId(userId),
    walletId: wallet._id,
    amount: input.amount,
    withdrawalFee: fee,
    netAmount,
    currency: wallet.currency,
    paymentMethod: input.paymentMethod,
    receiverAccountNumber: input.receiverAccountNumber,
    accountHolderName: input.accountHolderName,
  });
};

const listForUser = async (
  userId: string,
  options: WithdrawalListOptions,
  filters: WithdrawalFilters = {},
): Promise<PaginatedWithdrawals> => {
  return withdrawalRepository.findByUserId(new Types.ObjectId(userId), options, filters);
};

// A mismatched id reports WithdrawalNotFoundError, not AuthorizationError -
// same non-enumeration convention as deposit.service.ts's getByIdForUser.
const getByIdForUser = async (
  userId: string,
  withdrawalId: string,
): Promise<WithdrawalDocument> => {
  const withdrawal = await withdrawalRepository.findById(withdrawalId);

  if (!withdrawal || withdrawal.userId.toString() !== userId) {
    throw new WithdrawalNotFoundError();
  }

  return withdrawal;
};

// tasks/phase-06.md's Cancellation: users may cancel only PENDING
// withdrawals, and a cancelled withdrawal is never restored. No wallet or
// ledger Transaction is created - the withdrawal never affected the balance
// to begin with.
const cancelWithdrawal = async (
  userId: string,
  withdrawalId: string,
): Promise<WithdrawalDocument> => {
  const withdrawal = await getByIdForUser(userId, withdrawalId);

  assertIsPending(withdrawal);

  // fromStatuses is a query-level precondition, not just the in-memory
  // assertIsPending check above - closes the race where an admin approves
  // this same withdrawal between the read above and this write (see
  // withdrawal.repository.ts's updateStatus).
  const updated = await withdrawalRepository.updateStatus(withdrawal._id, PENDING_STATUSES, {
    status: WithdrawalStatus.CANCELLED,
  });

  if (!updated) {
    throw new WithdrawalInvalidTransitionError(
      'This withdrawal has already been reviewed and can no longer be changed.',
    );
  }

  return updated;
};

const listForAdmin = async (
  options: WithdrawalListOptions,
  filters: WithdrawalFilters = {},
): Promise<PaginatedWithdrawals> => {
  return withdrawalRepository.findAllAdmin(options, filters);
};

const getByIdForAdmin = async (withdrawalId: string): Promise<WithdrawalDocument> => {
  const withdrawal = await withdrawalRepository.findById(withdrawalId);

  if (!withdrawal) {
    throw new WithdrawalNotFoundError();
  }

  return withdrawal;
};

// tasks/phase-06.md's Admin Approval Screen - "Waiting Period Validation
// Result". Recomputes the same eligibility check createWithdrawal already
// ran at request time, using the withdrawal's own userId - a point-in-time
// read, not a stored field, since a user's eligibility can change (e.g. a
// later deposit) between submission and admin review.
const getWaitingPeriodStatusForAdmin = async (withdrawal: WithdrawalDocument): Promise<boolean> => {
  const settings = await settingsService.getWithdrawal();
  const firstApprovedDeposit = await depositRepository.findEarliestApprovedByUserId(
    withdrawal.userId,
  );

  return isWaitingPeriodSatisfied(firstApprovedDeposit, settings);
};

export const withdrawalService = {
  createWithdrawal,
  listForUser,
  getByIdForUser,
  cancelWithdrawal,
  listForAdmin,
  getByIdForAdmin,
  getWaitingPeriodStatusForAdmin,
  approveWithdrawal,
  rejectWithdrawal,
  markProcessing,
  completeWithdrawal,
};

export type { WithdrawalCompletionResult } from './withdrawal-review.service';
