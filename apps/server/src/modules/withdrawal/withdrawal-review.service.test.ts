import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  WithdrawalStatus,
} from 'shared-types';

import { InsufficientBalanceError, WithdrawalInvalidTransitionError } from '@/shared/errors';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import {
  createTestAdmin,
  createTestUser,
  createTestWallet,
  createTestWithdrawal,
} from '@/test/factories';

import { Transaction } from '../wallet/transaction.model';
import { Wallet } from '../wallet/wallet.model';

import {
  approveWithdrawal,
  completeWithdrawal,
  markProcessing,
  rejectWithdrawal,
} from './withdrawal-review.service';
import { Withdrawal } from './withdrawal.model';
import { withdrawalRepository } from './withdrawal.repository';

// completeWithdrawal composes walletService.debit into its own MongoDB
// transaction (withdrawal-review.service.ts's "decision 1" - Completion, not
// Approval, is the wallet-mutating event), which only a replica set supports
// - see test/db-transactional.ts. approve/reject/processing don't need it
// individually, but sharing one connection for the whole file (rather than
// starting a second, faster standalone instance just for those tests)
// matches deposit.service.test.ts's own reasoning for consolidating onto one
// DB connection per file.
jest.setTimeout(30000);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

// Reverses jest.spyOn(withdrawalRepository, 'updateStatus') in the rollback
// test even if an assertion before its own restoration throws - same
// rationale as deposit.service.test.ts's identical afterEach.
afterEach(() => {
  jest.restoreAllMocks();
});

describe('approveWithdrawal', () => {
  it('marks the withdrawal APPROVED without touching the wallet', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet);

    const updated = await approveWithdrawal(withdrawal.id, admin.id, 'Looks good');

    expect(updated.status).toBe(WithdrawalStatus.APPROVED);
    expect(updated.reviewedBy?.toString()).toBe(admin.id);
    expect(updated.adminNote).toBe('Looks good');

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(5000);
  });

  it('throws WithdrawalInvalidTransitionError for a non-PENDING withdrawal', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    await expect(approveWithdrawal(withdrawal.id, admin.id, undefined)).rejects.toBeInstanceOf(
      WithdrawalInvalidTransitionError,
    );
  });

  // Proves the atomic conditional update in withdrawal.repository.ts's
  // updateStatus - not just the in-memory assertIsPending guard - is what
  // actually prevents a concurrent transition from corrupting state.
  // withdrawalRepository.findById is stubbed to return a stale PENDING
  // snapshot (as if this call's own read already happened before a race),
  // while the real persisted document is moved on to APPROVED via a raw
  // update in between - only the query-level status filter inside
  // updateStatus can catch this, since the in-memory guard would see the
  // stale snapshot and pass.
  it('throws WithdrawalInvalidTransitionError, not a corrupted write, when the persisted status changes between the read and the write', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet);
    const staleSnapshot = await Withdrawal.findById(withdrawal.id).exec();

    jest.spyOn(withdrawalRepository, 'findById').mockResolvedValueOnce(staleSnapshot);
    await Withdrawal.updateOne(
      { _id: withdrawal._id },
      { $set: { status: WithdrawalStatus.APPROVED } },
    );

    await expect(approveWithdrawal(withdrawal.id, admin.id, undefined)).rejects.toBeInstanceOf(
      WithdrawalInvalidTransitionError,
    );

    const persisted = await Withdrawal.findById(withdrawal.id).exec();
    expect(persisted?.status).toBe(WithdrawalStatus.APPROVED);
    expect(persisted?.reviewedBy).toBeFalsy();
  });
});

describe('rejectWithdrawal', () => {
  it('marks the withdrawal REJECTED, leaving the wallet untouched', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet);

    const updated = await rejectWithdrawal(withdrawal.id, admin.id, 'Suspicious account');

    expect(updated.status).toBe(WithdrawalStatus.REJECTED);
    expect(updated.rejectionReason).toBe('Suspicious account');

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(5000);
    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });
});

describe('markProcessing', () => {
  it('moves an APPROVED withdrawal to PROCESSING', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    const updated = await markProcessing(withdrawal.id, admin.id);

    expect(updated.status).toBe(WithdrawalStatus.PROCESSING);
    expect(updated.processedAt).toBeInstanceOf(Date);
  });

  it('throws WithdrawalInvalidTransitionError from PENDING', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet);

    await expect(markProcessing(withdrawal.id, admin.id)).rejects.toBeInstanceOf(
      WithdrawalInvalidTransitionError,
    );
  });
});

describe('completeWithdrawal', () => {
  it('debits the wallet by the gross amount exactly once, creates a WITHDRAWAL ledger transaction, and marks the withdrawal COMPLETED', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    const result = await completeWithdrawal(withdrawal.id, admin.id);

    expect(result.withdrawal.status).toBe(WithdrawalStatus.COMPLETED);
    // Debits the gross amount (1000, the factory default), not netAmount (950).
    expect(result.wallet.availableBalance).toBe(4000);
    expect(result.transaction.category).toBe(TransactionCategory.WITHDRAWAL);
    expect(result.transaction.type).toBe(TransactionType.DEBIT);
    expect(result.transaction.status).toBe(TransactionStatus.COMPLETED);
    expect(result.transaction.amount).toBe(1000);
    expect(result.transaction.referenceId).toBe(withdrawal.withdrawalNumber);

    const transactions = await Transaction.find({ walletId: wallet._id }).exec();
    expect(transactions).toHaveLength(1);
  });

  it('succeeds from PROCESSING as well as APPROVED', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.PROCESSING,
    });

    const result = await completeWithdrawal(withdrawal.id, admin.id);

    expect(result.withdrawal.status).toBe(WithdrawalStatus.COMPLETED);
  });

  it.each([
    WithdrawalStatus.PENDING,
    WithdrawalStatus.COMPLETED,
    WithdrawalStatus.REJECTED,
    WithdrawalStatus.CANCELLED,
  ])('throws WithdrawalInvalidTransitionError when completing from %s', async (status) => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, { status });

    await expect(completeWithdrawal(withdrawal.id, admin.id)).rejects.toBeInstanceOf(
      WithdrawalInvalidTransitionError,
    );
  });

  it('throws InsufficientBalanceError and leaves the withdrawal in its prior status when the wallet balance has since dropped', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 200 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    await expect(completeWithdrawal(withdrawal.id, admin.id)).rejects.toBeInstanceOf(
      InsufficientBalanceError,
    );

    const persistedWithdrawal = await Withdrawal.findById(withdrawal.id).exec();
    expect(persistedWithdrawal?.status).toBe(WithdrawalStatus.APPROVED);
  });

  // Task 30 - force a mid-transaction failure (the withdrawal status update,
  // which runs *after* walletService.debit inside the same
  // session.withTransaction callback) and assert the whole operation rolled
  // back atomically: no ledger Transaction persisted, wallet balance and
  // withdrawal status unchanged. Same technique as
  // deposit.service.test.ts's approveDeposit rollback test.
  it('rolls back the wallet debit if the withdrawal status update fails mid-transaction', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 5000 });
    const { user: admin } = await createTestAdmin();
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    jest
      .spyOn(withdrawalRepository, 'updateStatus')
      .mockRejectedValueOnce(new Error('Simulated failure after the wallet debit ran'));

    await expect(completeWithdrawal(withdrawal.id, admin.id)).rejects.toThrow(
      'Simulated failure after the wallet debit ran',
    );

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(5000);

    const persistedWithdrawal = await Withdrawal.findById(withdrawal.id).exec();
    expect(persistedWithdrawal?.status).toBe(WithdrawalStatus.APPROVED);

    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });
});
