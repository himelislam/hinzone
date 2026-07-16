import request from 'supertest';
import { TransactionCategory } from 'shared-types';
import type { Transaction, Wallet } from 'shared-types';

import app from '@/app';
import {
  authHeaderFor,
  createTestTransaction,
  createTestUser,
  createTestWallet,
} from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { errorBody, successBody } from '@/test/http';

// GET /api/v1/wallet's endpoints are all read-only (no credit/debit call in
// wallet.controller.ts), so this file uses the standard, faster standalone
// test/db.ts helper rather than test/db-transactional.ts - fixtures are
// inserted directly through the Wallet/Transaction models (test/factories.ts),
// bypassing walletService entirely.
beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

// shared/response/response.helpers.ts's paginationResponse() has no `message`
// field, unlike the ApiSuccessResponse envelope successBody() assumes - same
// local shape as admin-users.test.ts's list endpoint.
interface PaginatedBody<T> {
  success: boolean;
  data: T[];
}

const paginatedBody = <T>(body: unknown): PaginatedBody<T> => body as PaginatedBody<T>;

describe('GET /api/v1/wallet', () => {
  it("returns the caller's own wallet", async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);

    const response = await request(app)
      .get('/api/v1/wallet')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<Wallet>(response.body).data.id).toBe(wallet.id);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/wallet');

    expect(response.status).toBe(401);
  });

  it('returns 404 when the authenticated user has no wallet yet', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/wallet')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(404);
  });
});

describe('GET /api/v1/wallet/summary', () => {
  it('returns the summary fields for the caller’s own wallet', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user, { availableBalance: 150, totalDeposited: 200 });

    const response = await request(app)
      .get('/api/v1/wallet/summary')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    const data = successBody<{ availableBalance: number; totalDeposited: number }>(
      response.body,
    ).data;
    expect(data.availableBalance).toBe(150);
    expect(data.totalDeposited).toBe(200);
  });
});

describe('GET /api/v1/wallet/transactions', () => {
  it("lists the caller's transactions, paginated", async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestTransaction(wallet, { amount: 10 });
    await createTestTransaction(wallet, { amount: 20 });

    const response = await request(app)
      .get('/api/v1/wallet/transactions')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(paginatedBody<Transaction>(response.body).data).toHaveLength(2);
  });

  it('filters by category', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestTransaction(wallet, { category: TransactionCategory.DEPOSIT });
    await createTestTransaction(wallet, { category: TransactionCategory.WITHDRAWAL });

    const response = await request(app)
      .get('/api/v1/wallet/transactions?category=DEPOSIT')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Transaction>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.category).toBe('DEPOSIT');
  });

  it('searches by transaction number', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const match = await createTestTransaction(wallet, { transactionNumber: 'TRX-20260716-000042' });
    await createTestTransaction(wallet, { transactionNumber: 'TRX-20260716-000099' });

    const response = await request(app)
      .get('/api/v1/wallet/transactions?search=000042')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Transaction>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(match.id);
  });

  it('searches by description, case-insensitively', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const match = await createTestTransaction(wallet, { description: 'Deposit via bKash' });
    await createTestTransaction(wallet, { description: 'Withdrawal to bank' });

    const response = await request(app)
      .get('/api/v1/wallet/transactions?search=bkash')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Transaction>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(match.id);
  });

  it('sorts by highestAmount', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestTransaction(wallet, { amount: 10 });
    await createTestTransaction(wallet, { amount: 50 });

    const response = await request(app)
      .get('/api/v1/wallet/transactions?sortBy=highestAmount')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Transaction>(response.body).data;
    expect(items[0]?.amount).toBe(50);
  });

  it('paginates with page/limit', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestTransaction(wallet);
    await createTestTransaction(wallet);
    await createTestTransaction(wallet);

    const response = await request(app)
      .get('/api/v1/wallet/transactions?page=1&limit=2')
      .set('Authorization', authHeaderFor(user));

    expect(paginatedBody<Transaction>(response.body).data).toHaveLength(2);
  });

  it("only returns the caller's own transactions, never another user's", async () => {
    const { user: userA } = await createTestUser();
    const { user: userB } = await createTestUser();
    const walletA = await createTestWallet(userA);
    const walletB = await createTestWallet(userB);
    await createTestTransaction(walletA);
    await createTestTransaction(walletB);

    const response = await request(app)
      .get('/api/v1/wallet/transactions')
      .set('Authorization', authHeaderFor(userA));

    const items = paginatedBody<Transaction>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.walletId).toBe(walletA.id);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/wallet/transactions');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/wallet/transactions/:id', () => {
  it('returns a single transaction belonging to the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const transaction = await createTestTransaction(wallet);

    const response = await request(app)
      .get(`/api/v1/wallet/transactions/${transaction.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<Transaction>(response.body).data.id).toBe(transaction.id);
  });

  it("returns 404 (not 403) for another user's transaction - no existence leak", async () => {
    const { user: owner } = await createTestUser();
    const { user: intruder } = await createTestUser();
    const wallet = await createTestWallet(owner);
    const transaction = await createTestTransaction(wallet);
    await createTestWallet(intruder);

    const response = await request(app)
      .get(`/api/v1/wallet/transactions/${transaction.id}`)
      .set('Authorization', authHeaderFor(intruder));

    expect(response.status).toBe(404);
  });

  it('returns 422 for a malformed transaction id', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    const response = await request(app)
      .get('/api/v1/wallet/transactions/not-a-valid-id')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });
});
