import { randomInt } from 'node:crypto';
import {
  AccountStatus,
  DepositStatus,
  SettingsCategory,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  UserRole,
  WithdrawalStatus,
} from 'shared-types';

import { signAccessToken } from '@/config/jwt';
import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { Deposit } from '@/modules/deposit/deposit.model';
import type { DepositDocument, IDeposit } from '@/modules/deposit/deposit.types';
import { User } from '@/modules/users/users.model';
import type { IUser, UserDocument } from '@/modules/users/users.types';
import { Transaction } from '@/modules/wallet/transaction.model';
import type { ITransaction, TransactionDocument } from '@/modules/wallet/transaction.types';
import { Wallet } from '@/modules/wallet/wallet.model';
import type { IWallet, WalletDocument } from '@/modules/wallet/wallet.types';
import { Withdrawal } from '@/modules/withdrawal/withdrawal.model';
import type { IWithdrawal, WithdrawalDocument } from '@/modules/withdrawal/withdrawal.types';

export const DEFAULT_TEST_PASSWORD = 'TestPass123!';

let counter = 0;

// Unique per call within a test file (counter) and across parallel-ish runs
// (Date.now()) - avoids unique-index collisions (username/phoneNumber/referralId)
// between test cases without needing a real random-word generator.
export const uniqueUsername = (prefix = 'user'): string => {
  counter += 1;

  return `${prefix}${Date.now().toString(36)}${counter}`.toLowerCase().slice(0, 30);
};

// Matches shared-validation's phoneNumberSchema: 01[3-9]xxxxxxxx (11 digits).
export const uniquePhoneNumber = (): string => `017${randomInt(10000000, 100000000)}`;

export const uniqueReferralId = (): string => `REF${randomInt(100000, 1000000)}`;

export interface RegisterPayloadOverrides {
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  referrerId?: string;
}

export const buildRegisterPayload = (
  overrides: RegisterPayloadOverrides = {},
): Required<Omit<RegisterPayloadOverrides, 'email' | 'referrerId'>> &
  Pick<RegisterPayloadOverrides, 'email' | 'referrerId'> => ({
  fullName: 'Test User',
  username: uniqueUsername(),
  phoneNumber: uniquePhoneNumber(),
  password: DEFAULT_TEST_PASSWORD,
  confirmPassword: DEFAULT_TEST_PASSWORD,
  ...overrides,
});

// Persists a user directly through the Mongoose model (so the pre-save hashing
// hook runs) rather than through the HTTP API - lets integration tests set up
// fixtures (e.g. a locked account, an admin) without a full register+login round
// trip for every test case.
export const createTestUser = async (
  overrides: Partial<IUser> = {},
): Promise<{ user: UserDocument; plainPassword: string }> => {
  const plainPassword = overrides.password ?? DEFAULT_TEST_PASSWORD;

  const user = await User.create({
    fullName: 'Test User',
    username: uniqueUsername(),
    phoneNumber: uniquePhoneNumber(),
    role: UserRole.USER,
    status: AccountStatus.ACTIVE,
    isVerified: false,
    loginAttempts: 0,
    referralId: uniqueReferralId(),
    joinDate: new Date(),
    ...overrides,
    password: plainPassword,
  });

  return { user, plainPassword };
};

export const createTestAdmin = (
  overrides: Partial<IUser> = {},
): Promise<{ user: UserDocument; plainPassword: string }> =>
  createTestUser({ role: UserRole.ADMIN, ...overrides });

// Matches the expiration connectTestDatabase() actually seeds (settings-defaults.ts),
// rather than a separately hardcoded string that could silently drift from it.
export const buildAccessToken = (user: UserDocument): string =>
  signAccessToken(
    { userId: user.id, username: user.username, role: user.role },
    SETTINGS_DEFAULTS[SettingsCategory.SECURITY].jwtAccessExpiration,
  );

export const authHeaderFor = (user: UserDocument): string => `Bearer ${buildAccessToken(user)}`;

// Wallet factories.

// Persists a wallet directly through the Mongoose model, bypassing
// walletService.createWallet - lets integration/service tests set up a fixture
// wallet (with an arbitrary starting balance/status) without needing a real
// registration flow.
export const createTestWallet = (
  user: UserDocument,
  overrides: Partial<IWallet> = {},
): Promise<WalletDocument> =>
  Wallet.create({
    userId: user._id,
    currency: 'BDT',
    ...overrides,
  });

// Unique per call within a test file - avoids colliding with
// transaction.model.ts's unique index on transactionNumber across fixtures.
let transactionCounter = 0;

export const uniqueTransactionNumber = (): string => {
  transactionCounter += 1;

  return `TRX-TEST-${Date.now().toString(36)}${transactionCounter}`;
};

// Persists a transaction directly through the Mongoose model, bypassing
// walletService.credit/debit - lets tests seed ledger fixtures without needing
// a replica-set-backed MongoDB (see test/db-transactional.ts).
export const createTestTransaction = (
  wallet: WalletDocument,
  overrides: Partial<ITransaction> = {},
): Promise<TransactionDocument> =>
  Transaction.create({
    transactionNumber: uniqueTransactionNumber(),
    walletId: wallet._id,
    userId: wallet.userId,
    type: TransactionType.CREDIT,
    category: TransactionCategory.DEPOSIT,
    amount: 100,
    balanceBefore: 0,
    balanceAfter: 100,
    currency: wallet.currency,
    status: TransactionStatus.COMPLETED,
    ...overrides,
  });

// Deposit factories.

// Unique per call within a test file - avoids colliding with
// deposit.model.ts's unique index on depositNumber across fixtures. Also
// reused for paymentReference, which has no uniqueness constraint but benefits
// from being distinct across fixtures in the same test.
let depositCounter = 0;

export const uniqueDepositNumber = (): string => {
  depositCounter += 1;

  return `DEP-TEST-${Date.now().toString(36)}${depositCounter}`;
};

// Persists a deposit directly through the Mongoose model, bypassing
// depositService.createDeposit - lets tests seed a PENDING (or any other
// status) fixture without needing Settings validation or a mocked Cloudinary
// upload. Defaults match the seeded DEPOSIT settings defaults (settings-defaults.ts)
// so a fixture is valid against them without every test needing to override amount.
export const createTestDeposit = (
  user: UserDocument,
  wallet: WalletDocument,
  overrides: Partial<IDeposit> = {},
): Promise<DepositDocument> =>
  Deposit.create({
    depositNumber: uniqueDepositNumber(),
    userId: user._id,
    walletId: wallet._id,
    amount: 3000,
    currency: wallet.currency,
    paymentMethod: 'bKash',
    senderAccountNumber: '01712345678',
    paymentReference: uniqueDepositNumber(),
    screenshotUrl: 'https://res.cloudinary.com/test-cloud/image/upload/mock-deposit.jpg',
    status: DepositStatus.PENDING,
    // Mongoose's timestamps plugin only auto-populates createdAt when it isn't
    // already provided on the document passed to create() (setDocumentTimestamps.js:
    // `!doc.$__getValue(createdAt)`), so a caller-supplied value in `overrides`
    // (e.g. to backdate an approved deposit past a withdrawal waiting period)
    // is respected rather than silently overwritten.
    ...overrides,
  });

const DAY_MS = 24 * 60 * 60 * 1000;

// Seeds an approved deposit `daysAgo` days old - used by withdrawal tests to
// establish (or deliberately fall short of) a waiting-period eligibility
// window (settings-defaults.ts's seeded WITHDRAWAL.waitingPeriodDays).
// Extracted here rather than left as a private per-file helper - it was
// independently duplicated (with the `daysAgo` parameter silently dropped in
// one copy) across withdrawal.service.test.ts and the withdrawal-api
// integration test before this consolidation.
export const createEligibleApprovedDeposit = (
  user: UserDocument,
  wallet: WalletDocument,
  daysAgo = 20,
): Promise<DepositDocument> =>
  createTestDeposit(user, wallet, {
    status: DepositStatus.APPROVED,
    createdAt: new Date(Date.now() - daysAgo * DAY_MS),
  });

// Withdrawal factories.

// Unique per call within a test file - avoids colliding with
// withdrawal.model.ts's unique index on withdrawalNumber across fixtures.
let withdrawalCounter = 0;

export const uniqueWithdrawalNumber = (): string => {
  withdrawalCounter += 1;

  return `WD-TEST-${Date.now().toString(36)}${withdrawalCounter}`;
};

// Persists a withdrawal directly through the Mongoose model, bypassing
// withdrawalService.createWithdrawal - lets tests seed a PENDING (or any
// other status) fixture without needing Settings validation, a real wallet
// balance check, or a seeded approved deposit. Defaults match the seeded
// WITHDRAWAL settings defaults (settings-defaults.ts: minimumWithdrawal 1000,
// withdrawalFeePercentage 5%) so a fixture is valid against them without
// every test needing to override amount.
export const createTestWithdrawal = (
  user: UserDocument,
  wallet: WalletDocument,
  overrides: Partial<IWithdrawal> = {},
): Promise<WithdrawalDocument> =>
  Withdrawal.create({
    withdrawalNumber: uniqueWithdrawalNumber(),
    userId: user._id,
    walletId: wallet._id,
    amount: 1000,
    withdrawalFee: 50,
    netAmount: 950,
    currency: wallet.currency,
    paymentMethod: 'bKash',
    receiverAccountNumber: '01712345678',
    accountHolderName: 'Test User',
    status: WithdrawalStatus.PENDING,
    ...overrides,
  });
