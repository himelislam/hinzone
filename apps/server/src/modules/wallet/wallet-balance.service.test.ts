import {
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  WalletStatus,
} from 'shared-types';

import { BusinessRuleError, InsufficientBalanceError, WalletNotActiveError } from '@/shared/errors';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import { createTestUser, createTestWallet } from '@/test/factories';

import { Transaction } from './transaction.model';
import { credit, debit } from './wallet-balance.service';
import { Wallet } from './wallet.model';
import { walletRepository } from './wallet.repository';

// credit/debit open a real MongoDB session/transaction (wallet-balance.service.ts,
// backend_rules.md #9), which only a replica set supports - see
// test/db-transactional.ts for why this file doesn't use the standard
// test/db.ts helper every other integration test uses. Replica set startup +
// real multi-document transactions are slower than the default 5s test timeout.
jest.setTimeout(30000);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

// Reverses the rollback test's jest.spyOn(walletRepository, 'updateBalance')
// even if an assertion before its own mockRestore() throws - without this, a
// failed assertion there would leak the mocked rejection into every debit()
// call in whichever test runs next.
afterEach(() => {
  jest.restoreAllMocks();
});

describe('credit', () => {
  it('increases the available balance and records a COMPLETED CREDIT transaction', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 50 });

    const result = await credit(wallet.id, {
      category: TransactionCategory.DEPOSIT,
      amount: 25,
      currency: 'BDT',
    });

    expect(result.wallet.availableBalance).toBe(75);
    expect(result.transaction.type).toBe(TransactionType.CREDIT);
    expect(result.transaction.status).toBe(TransactionStatus.COMPLETED);
    expect(result.transaction.balanceBefore).toBe(50);
    expect(result.transaction.balanceAfter).toBe(75);

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(75);

    const persistedTransactions = await Transaction.find({ walletId: wallet._id }).exec();
    expect(persistedTransactions).toHaveLength(1);
  });

  it('applies additionalBalanceEffects atomically alongside availableBalance', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 0, totalDeposited: 0 });

    const result = await credit(wallet.id, {
      category: TransactionCategory.DEPOSIT,
      amount: 40,
      currency: 'BDT',
      additionalBalanceEffects: { totalDeposited: 40 },
    });

    expect(result.wallet.availableBalance).toBe(40);
    expect(result.wallet.totalDeposited).toBe(40);
  });

  it('rejects a non-positive amount without opening a transaction', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10 });

    await expect(
      credit(wallet.id, { category: TransactionCategory.DEPOSIT, amount: 0, currency: 'BDT' }),
    ).rejects.toBeInstanceOf(BusinessRuleError);

    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });

  it('rejects crediting a non-ACTIVE wallet, leaving the balance untouched', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, {
      status: WalletStatus.FROZEN,
      availableBalance: 10,
    });

    await expect(
      credit(wallet.id, { category: TransactionCategory.DEPOSIT, amount: 10, currency: 'BDT' }),
    ).rejects.toBeInstanceOf(WalletNotActiveError);

    const persisted = await Wallet.findById(wallet.id).exec();
    expect(persisted?.availableBalance).toBe(10);
  });
});

describe('debit', () => {
  it('decreases the available balance and records a COMPLETED DEBIT transaction', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });

    const result = await debit(wallet.id, {
      category: TransactionCategory.WITHDRAWAL,
      amount: 40,
      currency: 'BDT',
    });

    expect(result.wallet.availableBalance).toBe(60);
    expect(result.transaction.type).toBe(TransactionType.DEBIT);
    expect(result.transaction.balanceBefore).toBe(100);
    expect(result.transaction.balanceAfter).toBe(60);
  });

  it('rejects a debit that exceeds the available balance, leaving the wallet and ledger untouched', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 30 });

    await expect(
      debit(wallet.id, { category: TransactionCategory.WITHDRAWAL, amount: 50, currency: 'BDT' }),
    ).rejects.toBeInstanceOf(InsufficientBalanceError);

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(30);
    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });

  it('rejects debiting a non-ACTIVE wallet', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, {
      status: WalletStatus.LOCKED,
      availableBalance: 100,
    });

    await expect(
      debit(wallet.id, { category: TransactionCategory.WITHDRAWAL, amount: 10, currency: 'BDT' }),
    ).rejects.toBeInstanceOf(WalletNotActiveError);
  });

  // Task 27 - force a mid-transaction failure (the wallet balance update, which
  // runs *after* the Transaction document is created inside the same
  // session.withTransaction callback) and assert the whole operation rolled
  // back atomically: no Transaction document persisted, balance unchanged.
  it('rolls back the transaction record if the wallet balance update fails mid-transaction', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 100 });

    jest
      .spyOn(walletRepository, 'updateBalance')
      .mockRejectedValueOnce(
        new Error('Simulated failure after the transaction record was created'),
      );

    await expect(
      debit(wallet.id, { category: TransactionCategory.WITHDRAWAL, amount: 40, currency: 'BDT' }),
    ).rejects.toThrow('Simulated failure after the transaction record was created');

    const persistedWallet = await Wallet.findById(wallet.id).exec();
    expect(persistedWallet?.availableBalance).toBe(100);
    expect(await Transaction.countDocuments({ walletId: wallet._id })).toBe(0);
  });
});
