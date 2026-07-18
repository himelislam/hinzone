import mongoose, { Types } from 'mongoose';
import { TransactionCategory, WithdrawalStatus } from 'shared-types';

import { WithdrawalInvalidTransitionError, WithdrawalNotFoundError } from '@/shared/errors';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditAction, AuditContext } from '../audit-log/audit-log.types';
import { walletService } from '../wallet/wallet.service';
import type { WalletMutationResult } from '../wallet/wallet.service';

import {
  assertCanComplete,
  COMPLETABLE_STATUSES,
  PENDING_STATUSES,
  PROCESSING_ELIGIBLE_STATUSES,
} from './withdrawal-business-rules';
import { withdrawalRepository } from './withdrawal.repository';
import type { UpdateWithdrawalStatusInput, WithdrawalDocument } from './withdrawal.types';

// Split out of withdrawal.service.ts purely to keep both files under the
// 300-line Service limit (coding_rules.md #3) - approve/reject/processing/
// complete are still WithdrawalService's admin-transition engine, not a
// distinct domain concern (same rationale as wallet-balance.service.ts's
// split from wallet.service.ts). withdrawal.service.ts imports these
// functions and re-exports them under the same withdrawalService object;
// this file deliberately does NOT import from withdrawal.service.ts, so the
// two files stay a one-directional dependency rather than a cycle
// (backend_rules.md #19).

export type WithdrawalCompletionResult = WalletMutationResult & {
  withdrawal: WithdrawalDocument;
};

// Shared by applyTransition and completeWithdrawal - both write an audit log
// entry with the same shape once their status change has actually
// persisted, differing only in which action/before/after payload applies.
// `before`/`after` are full objects (not just a status pair) so
// completeWithdrawal can additionally carry balance fields (tasks/phase-06.md's
// Audit Logs: "Previous Balance"/"New Balance") without forcing
// approve/reject/processing - which never touch the wallet - to fabricate
// balance values that never changed.
const recordTransitionAudit = async (
  adminId: string,
  withdrawalId: string,
  auditAction: AuditAction,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  context: AuditContext,
): Promise<void> => {
  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: auditAction,
    entity: 'Withdrawal',
    entityId: withdrawalId,
    before,
    after,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
};

// Shared by approve/reject/processing (not complete, which additionally
// mutates the wallet inside its own Mongo transaction and returns a
// different shape): find -> guard -> capture previous status -> update ->
// audit log -> return. Each caller supplies only what actually varies
// between the three transitions, rather than repeating the same shape three
// times.
//
// `fromStatuses` is checked twice on purpose: once here (in memory, against
// the just-read document, purely to fail fast with a clear error before
// attempting any write) and again as a query-level precondition inside
// withdrawalRepository.updateStatus. The in-memory check alone would leave a
// TOCTOU race - two concurrent transitions on the same withdrawal (e.g. an
// approve and a reject arriving together) could both read PENDING and both
// pass this check before either write commits. The repository's conditional
// update is what actually closes that race: if the status has changed by the
// time the write runs, it matches zero documents and returns null, and that
// is treated as an invalid transition below, not silently ignored.
const applyTransition = async (
  withdrawalId: string,
  adminId: string,
  fromStatuses: readonly WithdrawalStatus[],
  invalidTransitionMessage: string,
  update: UpdateWithdrawalStatusInput,
  auditAction: AuditAction,
  auditAfter: Record<string, unknown>,
  context: AuditContext,
): Promise<WithdrawalDocument> => {
  const withdrawal = await withdrawalRepository.findById(withdrawalId);

  if (!withdrawal) {
    throw new WithdrawalNotFoundError();
  }

  if (!fromStatuses.includes(withdrawal.status)) {
    throw new WithdrawalInvalidTransitionError(invalidTransitionMessage);
  }

  const previousStatus = withdrawal.status;

  const updated = await withdrawalRepository.updateStatus(withdrawal._id, fromStatuses, update);

  if (!updated) {
    // The in-memory check above passed, but the atomic conditional update
    // matched zero documents - another transition committed first.
    throw new WithdrawalInvalidTransitionError(invalidTransitionMessage);
  }

  await recordTransitionAudit(
    adminId,
    withdrawalId,
    auditAction,
    { status: previousStatus },
    auditAfter,
    context,
  );

  // Notification hook: no-op until the Notifications module exists (docs/15).

  return updated;
};

// tasks/phase-06.md's Withdrawal Approval Workflow, adjusted per this
// module's "decision 1" (docs/10-withdraw-module.md + docs/19-business-rules.md
// both name Completion, not Approval, as the wallet-mutating event): approval
// only records administrative sign-off - the wallet is untouched here.
const approveWithdrawal = (
  withdrawalId: string,
  adminId: string,
  adminNote: string | undefined,
  context: AuditContext = {},
): Promise<WithdrawalDocument> =>
  applyTransition(
    withdrawalId,
    adminId,
    PENDING_STATUSES,
    'This withdrawal has already been reviewed and can no longer be changed.',
    {
      status: WithdrawalStatus.APPROVED,
      reviewedBy: new Types.ObjectId(adminId),
      reviewedAt: new Date(),
      adminNote,
    },
    AUDIT_ACTIONS.WITHDRAWAL_APPROVED,
    { status: WithdrawalStatus.APPROVED, adminNote },
    context,
  );

// tasks/phase-06.md's Withdrawal Rejection Workflow. Wallet and ledger
// untouched. `reviewedBy` doubles as "the admin who reviewed this" for both
// the approve and reject outcomes, mirroring deposit.model.ts's single
// reviewedBy field covering both - named generically rather than
// "approvedBy" precisely because this (reject) path also sets it.
const rejectWithdrawal = (
  withdrawalId: string,
  adminId: string,
  rejectionReason: string,
  context: AuditContext = {},
): Promise<WithdrawalDocument> =>
  applyTransition(
    withdrawalId,
    adminId,
    PENDING_STATUSES,
    'This withdrawal has already been reviewed and can no longer be changed.',
    {
      status: WithdrawalStatus.REJECTED,
      reviewedBy: new Types.ObjectId(adminId),
      rejectionReason,
    },
    AUDIT_ACTIONS.WITHDRAWAL_REJECTED,
    { status: WithdrawalStatus.REJECTED, rejectionReason },
    context,
  );

// tasks/phase-06.md's Processing Workflow - an optional intermediate step so
// admins can track payment progress. No wallet change.
const markProcessing = (
  withdrawalId: string,
  adminId: string,
  context: AuditContext = {},
): Promise<WithdrawalDocument> =>
  applyTransition(
    withdrawalId,
    adminId,
    PROCESSING_ELIGIBLE_STATUSES,
    'Only an approved withdrawal can be moved to processing.',
    { status: WithdrawalStatus.PROCESSING, processedAt: new Date() },
    AUDIT_ACTIONS.WITHDRAWAL_PROCESSING,
    { status: WithdrawalStatus.PROCESSING },
    context,
  );

// The one operation in this module that actually calls WalletService.debit()
// (this module's "decision 1"). Mirrors deposit.service.ts's approveDeposit:
// the wallet mutation and the status update must commit or roll back
// together, so walletService.debit accepts this function's own session
// rather than running as two independently-committing operations. Unlike
// applyTransition's three callers, this one doesn't need a second,
// query-level guard against a concurrent transition - session.withTransaction
// already gives the read-then-write inside it snapshot isolation, and
// automatically retries the whole callback on a transient write conflict
// from another transaction touching the same document (same guarantee
// wallet-balance.service.ts's mutateBalanceInSession relies on). The
// fromStatuses argument to updateStatus below is still passed as
// defense-in-depth consistent with every other transition, not because this
// path is otherwise unsafe without it.
const completeWithdrawal = async (
  withdrawalId: string,
  adminId: string,
  context: AuditContext = {},
): Promise<WithdrawalCompletionResult> => {
  const session = await mongoose.startSession();
  let previousStatus: WithdrawalStatus | undefined;

  try {
    let result: WithdrawalCompletionResult | undefined;

    await session.withTransaction(async () => {
      // Re-read fresh inside the transaction (not before it starts) - the
      // same stale-read-across-retry rationale as
      // wallet-balance.service.ts's mutateBalanceInSession.
      const withdrawal = await withdrawalRepository.findById(withdrawalId, session);

      if (!withdrawal) {
        throw new WithdrawalNotFoundError();
      }

      assertCanComplete(withdrawal);
      previousStatus = withdrawal.status;

      // Debits the gross requested amount, not netAmount - the fee is
      // retained by the platform and the net amount is what leaves via the
      // external payment method, but the full requested amount leaves the
      // wallet (docs/10-withdraw-module.md's Transaction Integration
      // example: "amount": -50 for a $50 withdrawal).
      const mutation = await walletService.debit(
        withdrawal.walletId.toString(),
        {
          category: TransactionCategory.WITHDRAWAL,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          referenceId: withdrawal.withdrawalNumber,
          createdBy: adminId,
        },
        session,
      );

      const updatedWithdrawal = await withdrawalRepository.updateStatus(
        withdrawal._id,
        COMPLETABLE_STATUSES,
        { status: WithdrawalStatus.COMPLETED, completedAt: new Date() },
        session,
      );

      if (!updatedWithdrawal) {
        throw new WithdrawalNotFoundError();
      }

      result = {
        withdrawal: updatedWithdrawal,
        wallet: mutation.wallet,
        transaction: mutation.transaction,
      };
    });

    if (!result) {
      throw new WithdrawalNotFoundError();
    }

    // Audit logging happens after the transaction commits (recordTransitionAudit
    // has no session parameter - matches deposit.service.ts's approveDeposit).
    // balanceBefore/balanceAfter are read directly off the ledger Transaction
    // walletService.debit already created (result.transaction) rather than
    // re-fetched - it's the exact same values, computed once, no extra query.
    await recordTransitionAudit(
      adminId,
      withdrawalId,
      AUDIT_ACTIONS.WITHDRAWAL_COMPLETED,
      { status: previousStatus, balance: result.transaction.balanceBefore },
      { status: WithdrawalStatus.COMPLETED, balance: result.transaction.balanceAfter },
      context,
    );

    // Notification hook: no-op until the Notifications module exists.

    return result;
  } finally {
    await session.endSession();
  }
};

export { approveWithdrawal, rejectWithdrawal, markProcessing, completeWithdrawal };
