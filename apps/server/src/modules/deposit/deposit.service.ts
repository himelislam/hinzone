import mongoose, { Types } from 'mongoose';
import { DepositStatus, TransactionCategory } from 'shared-types';

import { DepositNotFoundError } from '@/shared/errors';
import { uploadImage } from '@/shared/helpers/upload-image';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';
import { settingsService } from '../settings/settings.service';
import { walletService } from '../wallet/wallet.service';
import type { WalletMutationResult } from '../wallet/wallet.service';

import {
  assertAmountWithinLimits,
  assertDepositsEnabled,
  assertIsPending,
  assertPackageExists,
  assertPaymentMethodAllowed,
} from './deposit-business-rules';
import { generateDepositNumber } from './deposit-number.util';
import { depositRepository } from './deposit.repository';
import type {
  DepositDocument,
  DepositFilters,
  DepositListOptions,
  PaginatedDeposits,
} from './deposit.types';

// tasks/phase-05.md's Deposit Screenshot Upload section.
const DEPOSIT_SCREENSHOT_UPLOAD_FOLDER = 'deposits';

// Mirrors admin-wallet.service.ts's AdjustWalletInput precedent: the service
// layer declares its own request shape rather than importing deposit.validation.ts's
// Zod-inferred type (backend_rules.md's layering keeps validation depending on
// nothing below it, not the reverse) - the controller (a later task) casts its
// validated req.body to this structurally-compatible shape.
export interface CreateDepositRequest {
  packageAmount: number;
  paymentMethod: string;
  senderAccountNumber: string;
  paymentReference: string;
}

export type DepositApprovalResult = WalletMutationResult & { deposit: DepositDocument };

// tasks/phase-05.md's Create Deposit Request workflow: Validate Settings ->
// Upload Screenshot -> Create Deposit (status PENDING) -> Notify Admin. Wallet
// balance is untouched - only DepositService.approveDeposit ever credits it.
const createDeposit = async (
  userId: string,
  input: CreateDepositRequest,
  file: { buffer: Buffer; mimetype: string },
): Promise<DepositDocument> => {
  const settings = await settingsService.getDeposit();

  assertDepositsEnabled(settings);
  assertPackageExists(input.packageAmount, settings);
  assertAmountWithinLimits(input.packageAmount, settings);
  assertPaymentMethodAllowed(input.paymentMethod, settings);

  const wallet = await walletService.getWalletByUser(userId);

  const depositNumber = await generateDepositNumber();

  // publicId = depositNumber (unique per submission, unlike users.service.ts's
  // avatar upload which intentionally overwrites on re-upload) - keeps the
  // Cloudinary asset traceable back to the deposit it belongs to.
  const screenshotUrl = await uploadImage(
    file.buffer,
    file.mimetype,
    DEPOSIT_SCREENSHOT_UPLOAD_FOLDER,
    depositNumber,
  );

  return depositRepository.create({
    depositNumber,
    userId: new Types.ObjectId(userId),
    walletId: wallet._id,
    amount: input.packageAmount,
    currency: wallet.currency,
    paymentMethod: input.paymentMethod,
    senderAccountNumber: input.senderAccountNumber,
    paymentReference: input.paymentReference,
    screenshotUrl,
  });
};

const listForUser = async (
  userId: string,
  options: DepositListOptions,
  filters: DepositFilters = {},
): Promise<PaginatedDeposits> => {
  return depositRepository.findByUserId(new Types.ObjectId(userId), options, filters);
};

// A mismatched id reports DepositNotFoundError, not AuthorizationError - same
// non-enumeration convention as wallet.service.ts's getTransaction: a caller
// probing another user's deposit id can't distinguish "exists but isn't yours"
// from "doesn't exist".
const getByIdForUser = async (userId: string, depositId: string): Promise<DepositDocument> => {
  const deposit = await depositRepository.findById(depositId);

  if (!deposit || deposit.userId.toString() !== userId) {
    throw new DepositNotFoundError();
  }

  return deposit;
};

// tasks/phase-05.md's Deposit Cancellation: users may cancel only PENDING
// deposits, and a cancelled deposit is never restored. No wallet or ledger
// Transaction is created - the deposit never affected the balance to begin with.
const cancelDeposit = async (userId: string, depositId: string): Promise<DepositDocument> => {
  const deposit = await getByIdForUser(userId, depositId);

  assertIsPending(deposit);

  const updated = await depositRepository.updateStatus(deposit._id, {
    status: DepositStatus.CANCELLED,
  });

  if (!updated) {
    throw new DepositNotFoundError();
  }

  return updated;
};

const listForAdmin = async (
  options: DepositListOptions,
  filters: DepositFilters = {},
): Promise<PaginatedDeposits> => {
  return depositRepository.findAllAdmin(options, filters);
};

const getByIdForAdmin = async (depositId: string): Promise<DepositDocument> => {
  const deposit = await depositRepository.findById(depositId);

  if (!deposit) {
    throw new DepositNotFoundError();
  }

  return deposit;
};

// tasks/phase-05.md's Deposit Approval Workflow: the wallet credit and the
// deposit's status transition must commit or roll back together (coding_rules.md
// #17 names "Deposit approval" as a financial operation requiring a MongoDB
// transaction; "partial updates are not allowed"). walletService.credit accepts
// this function's own session so both writes share one atomic transaction,
// rather than running as two independent, separately-committing operations
// (which would risk a double credit if a retry happened after the wallet write
// succeeded but the status write failed).
const approveDeposit = async (
  depositId: string,
  adminId: string,
  adminNote: string | undefined,
  context: AuditContext = {},
): Promise<DepositApprovalResult> => {
  const session = await mongoose.startSession();
  let previousStatus: DepositStatus | undefined;

  try {
    let result: DepositApprovalResult | undefined;

    await session.withTransaction(async () => {
      // Re-read fresh inside the transaction (not before it starts) - the same
      // stale-read-across-retry rationale as wallet-balance.service.ts's
      // mutateBalanceInSession.
      const deposit = await depositRepository.findById(depositId, session);

      if (!deposit) {
        throw new DepositNotFoundError();
      }

      assertIsPending(deposit);
      previousStatus = deposit.status;

      const mutation = await walletService.credit(
        deposit.walletId.toString(),
        {
          category: TransactionCategory.DEPOSIT,
          amount: deposit.amount,
          currency: deposit.currency,
          referenceId: deposit.depositNumber,
          createdBy: adminId,
        },
        session,
      );

      const updatedDeposit = await depositRepository.updateStatus(
        deposit._id,
        {
          status: DepositStatus.APPROVED,
          reviewedBy: new Types.ObjectId(adminId),
          reviewedAt: new Date(),
          adminNote,
        },
        session,
      );

      if (!updatedDeposit) {
        throw new DepositNotFoundError();
      }

      result = {
        deposit: updatedDeposit,
        wallet: mutation.wallet,
        transaction: mutation.transaction,
      };
    });

    if (!result) {
      throw new DepositNotFoundError();
    }

    // Audit logging happens after the transaction commits (auditLogRepository.create
    // has no session parameter - matches wallet-admin.service.ts's adjustWallet,
    // which also logs only after its own mutation has already committed).
    await auditLogRepository.create({
      userId: new Types.ObjectId(adminId),
      action: AUDIT_ACTIONS.DEPOSIT_APPROVED,
      entity: 'Deposit',
      entityId: depositId,
      before: { status: previousStatus },
      after: { status: DepositStatus.APPROVED, adminNote },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    // Notification hook: no-op until the Notifications module exists
    // (docs/15) - mirrors wallet-admin.service.ts's adjustWallet, which relies
    // on the WalletCredited event for the same reason.

    return result;
  } finally {
    await session.endSession();
  }
};

// tasks/phase-05.md's Deposit Rejection Workflow. No MongoDB transaction here -
// unlike approval, only the deposit document changes; the wallet is untouched.
const rejectDeposit = async (
  depositId: string,
  adminId: string,
  rejectionReason: string,
  context: AuditContext = {},
): Promise<DepositDocument> => {
  const deposit = await depositRepository.findById(depositId);

  if (!deposit) {
    throw new DepositNotFoundError();
  }

  assertIsPending(deposit);
  const previousStatus = deposit.status;

  const updated = await depositRepository.updateStatus(deposit._id, {
    status: DepositStatus.REJECTED,
    reviewedBy: new Types.ObjectId(adminId),
    reviewedAt: new Date(),
    rejectionReason,
  });

  if (!updated) {
    throw new DepositNotFoundError();
  }

  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.DEPOSIT_REJECTED,
    entity: 'Deposit',
    entityId: depositId,
    before: { status: previousStatus },
    after: { status: DepositStatus.REJECTED, rejectionReason },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  // Notification hook: no-op until the Notifications module exists.

  return updated;
};

export const depositService = {
  createDeposit,
  listForUser,
  getByIdForUser,
  cancelDeposit,
  listForAdmin,
  getByIdForAdmin,
  approveDeposit,
  rejectDeposit,
};
