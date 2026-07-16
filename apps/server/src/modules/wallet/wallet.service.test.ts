import { Types } from 'mongoose';
import { WalletStatus } from 'shared-types';

import { NotFoundError, WalletNotFoundError } from '@/shared/errors';

import { transactionRepository } from './transaction.repository';
import type { TransactionDocument } from './transaction.types';
import { walletEvents } from './wallet.events';
import { walletRepository } from './wallet.repository';
import { walletService } from './wallet.service';
import type { WalletDocument } from './wallet.types';

jest.mock('./wallet.repository');
jest.mock('./transaction.repository');

const mockedWalletRepository = jest.mocked(walletRepository);
const mockedTransactionRepository = jest.mocked(transactionRepository);

const WALLET_ID = '507f1f77bcf86cd799439011';
const USER_ID = '507f191e810c19729de860ea';

const buildWallet = (overrides: Record<string, unknown> = {}): WalletDocument =>
  ({
    id: WALLET_ID,
    _id: new Types.ObjectId(WALLET_ID),
    userId: new Types.ObjectId(USER_ID),
    availableBalance: 100,
    pendingBalance: 0,
    totalDeposited: 100,
    totalWithdrawn: 0,
    totalProfit: 0,
    totalInvestment: 0,
    currency: 'BDT',
    status: WalletStatus.ACTIVE,
    ...overrides,
  }) as unknown as WalletDocument;

const buildTransaction = (overrides: Record<string, unknown> = {}): TransactionDocument =>
  ({
    id: 'txn-1',
    walletId: new Types.ObjectId(WALLET_ID),
    ...overrides,
  }) as unknown as TransactionDocument;

beforeEach(() => {
  jest.clearAllMocks();
});

// restoreAllMocks reverses jest.spyOn(walletEvents, 'emit') below back to the
// real implementation even if a test's assertion throws before it reaches its
// own cleanup - it does not touch the jest.mock()'d repositories above, since
// those are module mocks rather than spies.
afterEach(() => {
  jest.restoreAllMocks();
});

describe('createWallet', () => {
  it('creates a new wallet when none exists for the user', async () => {
    mockedWalletRepository.findByUserId.mockResolvedValue(null);
    const created = buildWallet();
    mockedWalletRepository.create.mockResolvedValue(created);

    const result = await walletService.createWallet(USER_ID, 'BDT');

    const [[callArgs, callSession]] = mockedWalletRepository.create.mock.calls;
    expect(callArgs.userId).toBeInstanceOf(Types.ObjectId);
    expect(callArgs.currency).toBe('BDT');
    expect(callSession).toBeUndefined();
    expect(result).toBe(created);
  });

  it('is idempotent: returns the existing wallet without creating a duplicate', async () => {
    const existing = buildWallet();
    mockedWalletRepository.findByUserId.mockResolvedValue(existing);

    const result = await walletService.createWallet(USER_ID, 'BDT');

    expect(mockedWalletRepository.create).not.toHaveBeenCalled();
    expect(result).toBe(existing);
  });
});

describe('getWallet', () => {
  it('returns the wallet when found', async () => {
    const wallet = buildWallet();
    mockedWalletRepository.findById.mockResolvedValue(wallet);

    const result = await walletService.getWallet(WALLET_ID);

    expect(result).toBe(wallet);
  });

  it('throws WalletNotFoundError when the wallet does not exist', async () => {
    mockedWalletRepository.findById.mockResolvedValue(null);

    await expect(walletService.getWallet(WALLET_ID)).rejects.toBeInstanceOf(WalletNotFoundError);
  });
});

describe('getWalletByUser', () => {
  it('returns the wallet when found', async () => {
    const wallet = buildWallet();
    mockedWalletRepository.findByUserId.mockResolvedValue(wallet);

    const result = await walletService.getWalletByUser(USER_ID);

    expect(result).toBe(wallet);
  });

  it('throws WalletNotFoundError when the user has no wallet', async () => {
    mockedWalletRepository.findByUserId.mockResolvedValue(null);

    await expect(walletService.getWalletByUser(USER_ID)).rejects.toBeInstanceOf(
      WalletNotFoundError,
    );
  });
});

describe('freeze / unfreeze / lock / unlock', () => {
  it('freezes an active wallet', async () => {
    mockedWalletRepository.updateStatus.mockResolvedValue(
      buildWallet({ status: WalletStatus.FROZEN }),
    );

    const result = await walletService.freeze(WALLET_ID);

    expect(mockedWalletRepository.updateStatus).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      WalletStatus.FROZEN,
    );
    expect(result.status).toBe(WalletStatus.FROZEN);
  });

  it('unfreezes a wallet back to ACTIVE', async () => {
    mockedWalletRepository.updateStatus.mockResolvedValue(
      buildWallet({ status: WalletStatus.ACTIVE }),
    );

    const result = await walletService.unfreeze(WALLET_ID);

    expect(mockedWalletRepository.updateStatus).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      WalletStatus.ACTIVE,
    );
    expect(result.status).toBe(WalletStatus.ACTIVE);
  });

  it('locks a wallet and emits WalletLocked', async () => {
    const locked = buildWallet({ status: WalletStatus.LOCKED });
    mockedWalletRepository.updateStatus.mockResolvedValue(locked);
    const emitSpy = jest.spyOn(walletEvents, 'emit');

    await walletService.lock(WALLET_ID);

    expect(emitSpy).toHaveBeenCalledWith('WalletLocked', {
      walletId: locked.id,
      userId: locked.userId.toString(),
    });
  });

  it('unlocks a wallet and emits WalletUnlocked', async () => {
    const unlocked = buildWallet({ status: WalletStatus.ACTIVE });
    mockedWalletRepository.updateStatus.mockResolvedValue(unlocked);
    const emitSpy = jest.spyOn(walletEvents, 'emit');

    await walletService.unlock(WALLET_ID);

    expect(emitSpy).toHaveBeenCalledWith('WalletUnlocked', {
      walletId: unlocked.id,
      userId: unlocked.userId.toString(),
    });
  });

  it('throws WalletNotFoundError when the wallet does not exist', async () => {
    mockedWalletRepository.updateStatus.mockResolvedValue(null);

    await expect(walletService.freeze(WALLET_ID)).rejects.toBeInstanceOf(WalletNotFoundError);
  });
});

describe('calculateBalance', () => {
  it("returns the wallet's available balance", async () => {
    mockedWalletRepository.findById.mockResolvedValue(buildWallet({ availableBalance: 250 }));

    const result = await walletService.calculateBalance(WALLET_ID);

    expect(result).toBe(250);
  });
});

describe('getWalletSummary', () => {
  it('returns the summary fields read from the wallet', async () => {
    mockedWalletRepository.findById.mockResolvedValue(
      buildWallet({
        availableBalance: 100,
        pendingBalance: 10,
        totalDeposited: 500,
        totalWithdrawn: 50,
        totalInvestment: 200,
        totalProfit: 30,
      }),
    );

    const result = await walletService.getWalletSummary(WALLET_ID);

    expect(result).toEqual({
      availableBalance: 100,
      pendingBalance: 10,
      totalDeposited: 500,
      totalWithdrawn: 50,
      totalInvestment: 200,
      totalProfit: 30,
    });
  });
});

describe('getTransactionHistory', () => {
  it('confirms the wallet exists, then delegates to the transaction repository', async () => {
    mockedWalletRepository.findById.mockResolvedValue(buildWallet());
    mockedTransactionRepository.findByWalletId.mockResolvedValue({ items: [], total: 0 });

    const result = await walletService.getTransactionHistory(WALLET_ID, { page: 1, limit: 20 });

    expect(mockedTransactionRepository.findByWalletId).toHaveBeenCalledWith(
      expect.any(Types.ObjectId),
      { page: 1, limit: 20 },
      {},
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('throws WalletNotFoundError before ever querying transactions', async () => {
    mockedWalletRepository.findById.mockResolvedValue(null);

    await expect(
      walletService.getTransactionHistory(WALLET_ID, { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(WalletNotFoundError);
    expect(mockedTransactionRepository.findByWalletId).not.toHaveBeenCalled();
  });
});

describe('getTransaction', () => {
  it('returns the transaction when it belongs to the given wallet', async () => {
    const transaction = buildTransaction();
    mockedTransactionRepository.findById.mockResolvedValue(transaction);

    const result = await walletService.getTransaction(WALLET_ID, 'txn-1');

    expect(result).toBe(transaction);
  });

  it('throws NotFoundError when the transaction belongs to a different wallet', async () => {
    mockedTransactionRepository.findById.mockResolvedValue(
      buildTransaction({ walletId: new Types.ObjectId() }),
    );

    await expect(walletService.getTransaction(WALLET_ID, 'txn-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws NotFoundError when the transaction does not exist', async () => {
    mockedTransactionRepository.findById.mockResolvedValue(null);

    await expect(walletService.getTransaction(WALLET_ID, 'txn-1')).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
