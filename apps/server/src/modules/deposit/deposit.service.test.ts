import {
  DepositStatus,
  SettingsCategory,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
} from 'shared-types';

import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { DepositNotPendingError } from '@/shared/errors';
import { uploadImage } from '@/shared/helpers/upload-image';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import {
  createTestAdmin,
  createTestDeposit,
  createTestUser,
  createTestWallet,
} from '@/test/factories';

import { settingsService } from '../settings/settings.service';
import { Transaction } from '../wallet/transaction.model';
import { Wallet } from '../wallet/wallet.model';

import { Deposit } from './deposit.model';
import { depositRepository } from './deposit.repository';
import { depositService } from './deposit.service';

// approveDeposit composes walletService.credit into its own MongoDB transaction
// (deposit.service.ts, tasks/phase-05.md's Deposit Approval Workflow), which
// only a replica set supports - see test/db-transactional.ts. createDeposit
// calls the real (non-mocked) settingsService/walletService against this same
// database so business-rule branches are exercised for real rather than through
// mocks; uploadImage is the only mock, since it is the sole external/network
// dependency (Cloudinary).
jest.mock('@/shared/helpers/upload-image');

jest.setTimeout(30000);

const FAKE_SCREENSHOT_URL = 'https://res.cloudinary.com/test-cloud/image/upload/mock-deposit.jpg';
const mockedUploadImage = jest.mocked(uploadImage);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

// Reverses jest.spyOn(depositRepository, 'updateStatus') in the rollback test
// even if an assertion before its own restoration throws - same rationale as
// wallet-balance.service.test.ts's identical afterEach.
afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  mockedUploadImage.mockResolvedValue(FAKE_SCREENSHOT_URL);
});

const VALID_CREATE_INPUT = {
  packageAmount: 3000,
  paymentMethod: 'bKash',
  senderAccountNumber: '01712345678',
  paymentReference: 'TXN-VALID-001',
};

const SETTINGS_RESET_ADMIN_ID = '507f1f77bcf86cd799439011';

describe('createDeposit', () => {
  // Guards against the 'disabled' test below leaking a permanently-disabled
  // DEPOSIT settings document (and its cached copy - updateDeposit refreshes
  // the cache itself) into whichever test runs next: clearTestDatabase()
  // deliberately never touches the settings collection (test/db.ts, "Settings
  // is... seeded once per test file, not per-test fixture data"), so an
  // explicit reset is required here. Runs after every test in this block
  // unconditionally - idempotent and harmless for tests that never touched
  // settings, same defensive reasoning as wallet-balance.service.test.ts's own
  // afterEach(() => jest.restoreAllMocks()).
  afterEach(async () => {
    await settingsService.updateDeposit(
      SETTINGS_DEFAULTS[SettingsCategory.DEPOSIT],
      SETTINGS_RESET_ADMIN_ID,
    );
  });

  it('creates a PENDING deposit for a valid package/payment method, leaving the wallet balance unchanged', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });

    const deposit = await depositService.createDeposit(user.id, VALID_CREATE_INPUT, {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
    });

    expect(deposit.status).toBe(DepositStatus.PENDING);
    expect(deposit.amount).toBe(3000);
    expect(deposit.walletId.toString()).toBe(wallet.id);
    expect(deposit.screenshotUrl).toBe(FAKE_SCREENSHOT_URL);
    expect(mockedUploadImage).toHaveBeenCalledTimes(1);

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(100);
  });

  it('rejects when deposits are disabled in Settings', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);
    const { user: admin } = await createTestAdmin();

    await settingsService.updateDeposit(
      {
        enabled: false,
        packages: [{ amount: 3000 }],
        minimumDeposit: 3000,
        maximumDeposit: 100000,
        paymentMethods: ['bKash', 'Nagad'],
      },
      admin.id,
    );

    await expect(
      depositService.createDeposit(user.id, VALID_CREATE_INPUT, {
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/jpeg',
      }),
    ).rejects.toThrow('Deposits are currently disabled.');

    expect(await Deposit.countDocuments({ userId: user._id })).toBe(0);
  });

  it('rejects an amount that does not match any configured package', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    await expect(
      depositService.createDeposit(
        user.id,
        { ...VALID_CREATE_INPUT, packageAmount: 4500 },
        { buffer: Buffer.from('fake-image-data'), mimetype: 'image/jpeg' },
      ),
    ).rejects.toThrow('Selected deposit package is not available.');
  });

  it('rejects a disallowed payment method', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    await expect(
      depositService.createDeposit(
        user.id,
        { ...VALID_CREATE_INPUT, paymentMethod: 'Bank Transfer' },
        { buffer: Buffer.from('fake-image-data'), mimetype: 'image/jpeg' },
      ),
    ).rejects.toThrow('Selected payment method is not available.');
  });
});

describe('approveDeposit', () => {
  it('credits the wallet exactly once, creates a DEPOSIT ledger transaction, and marks the deposit APPROVED', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });
    const { user: admin } = await createTestAdmin();
    const deposit = await createTestDeposit(user, wallet, { amount: 50 });

    const result = await depositService.approveDeposit(deposit.id, admin.id, undefined);

    expect(result.deposit.status).toBe(DepositStatus.APPROVED);
    expect(result.wallet.availableBalance).toBe(150);
    expect(result.transaction.category).toBe(TransactionCategory.DEPOSIT);
    expect(result.transaction.type).toBe(TransactionType.CREDIT);
    expect(result.transaction.status).toBe(TransactionStatus.COMPLETED);
    expect(result.transaction.referenceId).toBe(deposit.depositNumber);

    const transactions = await Transaction.find({ walletId: wallet._id }).exec();
    expect(transactions).toHaveLength(1);
  });

  it('throws DepositNotPendingError when the deposit has already been reviewed', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });
    const { user: admin } = await createTestAdmin();
    const deposit = await createTestDeposit(user, wallet, { status: DepositStatus.APPROVED });

    await expect(
      depositService.approveDeposit(deposit.id, admin.id, undefined),
    ).rejects.toBeInstanceOf(DepositNotPendingError);

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(100);
  });

  // Task 25 - force a mid-transaction failure (the deposit status update, which
  // runs *after* walletService.credit inside the same session.withTransaction
  // callback) and assert the whole operation rolled back atomically: no ledger
  // Transaction persisted, wallet balance and deposit status unchanged. Proves
  // the wallet-balance.service.ts session-composability fix (Task D) actually
  // gives this approval real all-or-nothing atomicity.
  it('rolls back the wallet credit if the deposit status update fails mid-transaction', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });
    const { user: admin } = await createTestAdmin();
    const deposit = await createTestDeposit(user, wallet, { amount: 50 });

    jest
      .spyOn(depositRepository, 'updateStatus')
      .mockRejectedValueOnce(new Error('Simulated failure after the wallet credit ran'));

    await expect(depositService.approveDeposit(deposit.id, admin.id, undefined)).rejects.toThrow(
      'Simulated failure after the wallet credit ran',
    );

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(100);

    const persistedDeposit = await Deposit.findById(deposit.id).exec();
    expect(persistedDeposit?.status).toBe(DepositStatus.PENDING);

    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });
});

describe('rejectDeposit', () => {
  it('marks the deposit REJECTED, leaving the wallet untouched', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });
    const { user: admin } = await createTestAdmin();
    const deposit = await createTestDeposit(user, wallet);

    const updated = await depositService.rejectDeposit(
      deposit.id,
      admin.id,
      'Screenshot unreadable',
    );

    expect(updated.status).toBe(DepositStatus.REJECTED);
    expect(updated.rejectionReason).toBe('Screenshot unreadable');

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(100);
    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });
});

describe('cancelDeposit', () => {
  it('cancels a PENDING deposit owned by the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const deposit = await createTestDeposit(user, wallet);

    const updated = await depositService.cancelDeposit(user.id, deposit.id);

    expect(updated.status).toBe(DepositStatus.CANCELLED);
  });

  it('rejects cancelling a deposit that is no longer PENDING', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const deposit = await createTestDeposit(user, wallet, { status: DepositStatus.APPROVED });

    await expect(depositService.cancelDeposit(user.id, deposit.id)).rejects.toBeInstanceOf(
      DepositNotPendingError,
    );
  });
});
