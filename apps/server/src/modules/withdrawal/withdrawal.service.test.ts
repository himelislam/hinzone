import { SettingsCategory, WalletStatus, WithdrawalStatus } from 'shared-types';

import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { WalletNotActiveError, WithdrawalInvalidTransitionError } from '@/shared/errors';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import {
  createEligibleApprovedDeposit,
  createTestAdmin,
  createTestUser,
  createTestWallet,
  createTestWithdrawal,
} from '@/test/factories';

import { settingsService } from '../settings/settings.service';
import { Wallet } from '../wallet/wallet.model';

import { Withdrawal } from './withdrawal.model';
import { withdrawalRepository } from './withdrawal.repository';
import { withdrawalService } from './withdrawal.service';

// None of withdrawal.service.ts's functions call walletService.debit (only
// withdrawal-review.service.ts's completeWithdrawal does), so this file uses
// the standard, faster standalone test/db.ts helper rather than
// test/db-transactional.ts - same reasoning as deposit-api.test.ts.
// approve/reject/processing/complete are covered separately in
// withdrawal-review.service.test.ts, which does need the transactional
// variant.
jest.setTimeout(20000);

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

// Reverses jest.spyOn(withdrawalRepository, 'findById') in the concurrent-
// transition test even if an assertion before its own restoration throws -
// same rationale as deposit.service.test.ts's identical afterEach.
afterEach(() => {
  jest.restoreAllMocks();
});

const SETTINGS_RESET_ADMIN_ID = '507f1f77bcf86cd799439011';

const VALID_CREATE_INPUT = {
  amount: 5000,
  paymentMethod: 'bKash',
  receiverAccountNumber: '01712345678',
  accountHolderName: 'Test User',
};

describe('createWithdrawal', () => {
  // Guards against a test that disables/edits WITHDRAWAL settings leaking a
  // permanently-changed settings document (and its cached copy - updateWithdrawal
  // refreshes the cache itself) into whichever test runs next: clearTestDatabase()
  // deliberately never touches the settings collection (test/db.ts). Runs
  // after every test in this block unconditionally - idempotent and harmless
  // for tests that never touched settings, same defensive reasoning as
  // deposit.service.test.ts's own afterEach.
  afterEach(async () => {
    await settingsService.updateWithdrawal(
      SETTINGS_DEFAULTS[SettingsCategory.WITHDRAWAL],
      SETTINGS_RESET_ADMIN_ID,
    );
  });

  it('creates a PENDING withdrawal with fee/netAmount computed from Settings, leaving the wallet balance unchanged', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet);

    const withdrawal = await withdrawalService.createWithdrawal(user.id, VALID_CREATE_INPUT);

    expect(withdrawal.status).toBe(WithdrawalStatus.PENDING);
    expect(withdrawal.amount).toBe(5000);
    // Seeded fee is 5% (settings-defaults.ts).
    expect(withdrawal.withdrawalFee).toBe(250);
    expect(withdrawal.netAmount).toBe(4750);
    expect(withdrawal.walletId.toString()).toBe(wallet.id);

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(10000);
  });

  it('rejects when withdrawals are disabled in Settings', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet);
    const { user: admin } = await createTestAdmin();

    await settingsService.updateWithdrawal(
      { ...SETTINGS_DEFAULTS[SettingsCategory.WITHDRAWAL], enabled: false },
      admin.id,
    );

    await expect(withdrawalService.createWithdrawal(user.id, VALID_CREATE_INPUT)).rejects.toThrow(
      'Withdrawals are currently disabled.',
    );

    expect(await Withdrawal.countDocuments({ userId: user._id })).toBe(0);
  });

  it('rejects an amount outside the configured min/max', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user, { availableBalance: 10000 });

    await expect(
      withdrawalService.createWithdrawal(user.id, { ...VALID_CREATE_INPUT, amount: 500 }),
    ).rejects.toThrow('Withdrawal amount must be between');
  });

  it('rejects a disallowed payment method', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user, { availableBalance: 10000 });

    await expect(
      withdrawalService.createWithdrawal(user.id, {
        ...VALID_CREATE_INPUT,
        paymentMethod: 'Bank Transfer',
      }),
    ).rejects.toThrow('Selected payment method is not available.');
  });

  it('rejects a withdrawal larger than the available wallet balance', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user, { availableBalance: 1000 });

    await expect(
      withdrawalService.createWithdrawal(user.id, { ...VALID_CREATE_INPUT, amount: 5000 }),
    ).rejects.toThrow('Insufficient wallet balance for this withdrawal.');
  });

  it('rejects a withdrawal request against a non-ACTIVE wallet', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user, { availableBalance: 10000, status: WalletStatus.FROZEN });

    await expect(
      withdrawalService.createWithdrawal(user.id, VALID_CREATE_INPUT),
    ).rejects.toBeInstanceOf(WalletNotActiveError);
  });

  it('rejects when the user has no approved deposit at all', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user, { availableBalance: 10000 });

    await expect(withdrawalService.createWithdrawal(user.id, VALID_CREATE_INPUT)).rejects.toThrow(
      'An approved deposit is required before withdrawals become eligible.',
    );
  });

  it('rejects when the waiting period has not yet elapsed', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    // Approved deposit from 5 days ago - short of the seeded 15-day period.
    await createEligibleApprovedDeposit(user, wallet, 5);

    await expect(withdrawalService.createWithdrawal(user.id, VALID_CREATE_INPUT)).rejects.toThrow(
      /day\(s\) remaining/,
    );
  });

  it('succeeds once the waiting period has elapsed', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet, 15);

    const withdrawal = await withdrawalService.createWithdrawal(user.id, VALID_CREATE_INPUT);

    expect(withdrawal.status).toBe(WithdrawalStatus.PENDING);
  });
});

describe('cancelWithdrawal', () => {
  it('cancels a PENDING withdrawal owned by the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const withdrawal = await createTestWithdrawal(user, wallet);

    const updated = await withdrawalService.cancelWithdrawal(user.id, withdrawal.id);

    expect(updated.status).toBe(WithdrawalStatus.CANCELLED);
  });

  it('rejects cancelling a withdrawal that is no longer PENDING', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    await expect(withdrawalService.cancelWithdrawal(user.id, withdrawal.id)).rejects.toBeInstanceOf(
      WithdrawalInvalidTransitionError,
    );
  });

  // Proves the atomic conditional update in withdrawal.repository.ts's
  // updateStatus - not just the in-memory assertIsPending guard - is what
  // actually prevents a concurrent transition (e.g. an admin approving this
  // same withdrawal) from being silently overwritten by this cancel.
  // withdrawalRepository.findById is stubbed to return a stale PENDING
  // snapshot, while the real persisted document is moved on to APPROVED via
  // a raw update in between.
  it('throws WithdrawalInvalidTransitionError, not a corrupted write, when the persisted status changes between the read and the write', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const withdrawal = await createTestWithdrawal(user, wallet);
    const staleSnapshot = await Withdrawal.findById(withdrawal.id).exec();

    jest.spyOn(withdrawalRepository, 'findById').mockResolvedValueOnce(staleSnapshot);
    await Withdrawal.updateOne(
      { _id: withdrawal._id },
      { $set: { status: WithdrawalStatus.APPROVED } },
    );

    await expect(withdrawalService.cancelWithdrawal(user.id, withdrawal.id)).rejects.toBeInstanceOf(
      WithdrawalInvalidTransitionError,
    );

    const persisted = await Withdrawal.findById(withdrawal.id).exec();
    expect(persisted?.status).toBe(WithdrawalStatus.APPROVED);
  });
});
