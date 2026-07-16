import request from 'supertest';
import { TransactionCategory, TransactionType } from 'shared-types';
import type { Wallet } from 'shared-types';

import app from '@/app';
import { AuditLog } from '@/modules/audit-log/audit-log.model';
import { AUDIT_ACTIONS } from '@/modules/audit-log/audit-log.types';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import { authHeaderFor, createTestAdmin, createTestUser, createTestWallet } from '@/test/factories';
import { errorBody, successBody } from '@/test/http';

// POST /admin/wallets/:id/adjust calls walletService.credit/debit, which opens
// a real MongoDB session/transaction - see test/db-transactional.ts. The
// read-only list/get endpoints in this file work fine against the same
// replica-set-backed connection, so the whole file shares one beforeAll.
jest.setTimeout(30000);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

interface PaginatedBody<T> {
  success: boolean;
  data: T[];
}

const paginatedBody = <T>(body: unknown): PaginatedBody<T> => body as PaginatedBody<T>;

describe('GET /api/v1/admin/wallets', () => {
  it('lists wallets for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);

    const response = await request(app)
      .get('/api/v1/admin/wallets')
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const ids = paginatedBody<Wallet>(response.body).data.map((item) => item.id);
    expect(ids).toContain(wallet.id);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/admin/wallets')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/admin/wallets');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/admin/wallets/:id', () => {
  it('returns a single wallet for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);

    const response = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Wallet>(response.body).data.id).toBe(wallet.id);
  });
});

describe('GET /api/v1/admin/wallets/user/:userId', () => {
  it('returns the wallet for a given user id', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);

    const response = await request(app)
      .get(`/api/v1/admin/wallets/user/${regular.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Wallet>(response.body).data.id).toBe(wallet.id);
  });
});

describe('POST /api/v1/admin/wallets/:id/adjust', () => {
  it('credits a wallet, returning the updated wallet/transaction and writing an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 50 });

    const response = await request(app)
      .post(`/api/v1/admin/wallets/${wallet.id}/adjust`)
      .set('Authorization', authHeaderFor(admin))
      .send({
        type: TransactionType.CREDIT,
        category: TransactionCategory.ADMIN_ADJUSTMENT,
        amount: 25,
        reason: 'Manual correction after support ticket #123',
      });

    expect(response.status).toBe(200);
    const data = successBody<{
      wallet: Wallet;
      transaction: { balanceBefore: number; balanceAfter: number };
    }>(response.body).data;
    expect(data.wallet.availableBalance).toBe(75);
    expect(data.transaction.balanceBefore).toBe(50);
    expect(data.transaction.balanceAfter).toBe(75);

    const auditLogs = await AuditLog.find({ entity: 'Wallet', entityId: wallet.id }).exec();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe(AUDIT_ACTIONS.WALLET_ADJUSTED);
    expect(auditLogs[0]?.userId.toString()).toBe(admin.id);
  });

  it('rejects a debit that exceeds the available balance, writing no audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 10 });

    const response = await request(app)
      .post(`/api/v1/admin/wallets/${wallet.id}/adjust`)
      .set('Authorization', authHeaderFor(admin))
      .send({
        type: TransactionType.DEBIT,
        category: TransactionCategory.ADMIN_ADJUSTMENT,
        amount: 100,
        reason: 'Attempted over-debit',
      });

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('INSUFFICIENT_BALANCE');

    const auditLogs = await AuditLog.find({ entity: 'Wallet', entityId: wallet.id }).exec();
    expect(auditLogs).toHaveLength(0);

    const persisted = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(successBody<Wallet>(persisted.body).data.availableBalance).toBe(10);
  });

  it('rejects a missing reason with 422', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);

    const response = await request(app)
      .post(`/api/v1/admin/wallets/${wallet.id}/adjust`)
      .set('Authorization', authHeaderFor(admin))
      .send({
        type: TransactionType.CREDIT,
        category: TransactionCategory.ADMIN_ADJUSTMENT,
        amount: 10,
      });

    expect(response.status).toBe(422);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);

    const response = await request(app)
      .post(`/api/v1/admin/wallets/${wallet.id}/adjust`)
      .set('Authorization', authHeaderFor(user))
      .send({
        type: TransactionType.CREDIT,
        category: TransactionCategory.ADMIN_ADJUSTMENT,
        amount: 10,
        reason: 'test',
      });

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);

    const response = await request(app).post(`/api/v1/admin/wallets/${wallet.id}/adjust`).send({
      type: TransactionType.CREDIT,
      category: TransactionCategory.ADMIN_ADJUSTMENT,
      amount: 10,
      reason: 'test',
    });

    expect(response.status).toBe(401);
  });
});
