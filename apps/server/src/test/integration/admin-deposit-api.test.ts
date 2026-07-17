import request from 'supertest';
import { DepositStatus } from 'shared-types';
import type { Deposit, Wallet } from 'shared-types';

import app from '@/app';
import { AuditLog } from '@/modules/audit-log/audit-log.model';
import { AUDIT_ACTIONS } from '@/modules/audit-log/audit-log.types';
import { clearTestDatabase } from '@/test/db';
import {
  connectTransactionalTestDatabase,
  disconnectTransactionalTestDatabase,
} from '@/test/db-transactional';
import {
  authHeaderFor,
  createTestAdmin,
  createTestDeposit,
  createTestUser,
  createTestWallet,
} from '@/test/factories';
import { errorBody, successBody } from '@/test/http';

// PATCH /admin/deposits/:id/approve calls walletService.credit, which opens a
// real MongoDB session/transaction - see test/db-transactional.ts. The
// read-only list/get and the reject endpoint (single-document update, no
// transaction) work fine against the same replica-set-backed connection, so
// the whole file shares one beforeAll - same reasoning as
// admin-wallet-api.test.ts.
jest.setTimeout(30000);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

interface PaginatedBody<T> {
  success: boolean;
  data: T[];
}

const paginatedBody = <T>(body: unknown): PaginatedBody<T> => body as PaginatedBody<T>;

describe('GET /api/v1/admin/deposits', () => {
  it('lists deposits across users for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .get('/api/v1/admin/deposits')
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const ids = paginatedBody<Deposit>(response.body).data.map((item) => item.id);
    expect(ids).toContain(deposit.id);
  });

  it('filters by payment method', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    await createTestDeposit(regular, wallet, { paymentMethod: 'bKash' });
    await createTestDeposit(regular, wallet, { paymentMethod: 'Nagad' });

    const response = await request(app)
      .get('/api/v1/admin/deposits?paymentMethod=Nagad')
      .set('Authorization', authHeaderFor(admin));

    const items = paginatedBody<Deposit>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.paymentMethod).toBe('Nagad');
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/admin/deposits')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/admin/deposits');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/admin/deposits/:id', () => {
  it('returns a single deposit for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .get(`/api/v1/admin/deposits/${deposit.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Deposit>(response.body).data.id).toBe(deposit.id);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .get(`/api/v1/admin/deposits/${deposit.id}`)
      .set('Authorization', authHeaderFor(regular));

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/deposits/:id/approve', () => {
  it('credits the wallet, marks the deposit APPROVED, and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 50 });
    const deposit = await createTestDeposit(regular, wallet, { amount: 25 });

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/approve`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const data = successBody<Deposit>(response.body).data;
    expect(data.status).toBe(DepositStatus.APPROVED);

    const walletResponse = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(successBody<Wallet>(walletResponse.body).data.availableBalance).toBe(75);

    const auditLogs = await AuditLog.find({ entity: 'Deposit', entityId: deposit.id }).exec();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe(AUDIT_ACTIONS.DEPOSIT_APPROVED);
    expect(auditLogs[0]?.userId.toString()).toBe(admin.id);
  });

  it('rejects approving a deposit that is no longer PENDING, writing no audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 50 });
    const deposit = await createTestDeposit(regular, wallet, { status: DepositStatus.REJECTED });

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/approve`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('DEPOSIT_NOT_PENDING');

    const auditLogs = await AuditLog.find({ entity: 'Deposit', entityId: deposit.id }).exec();
    expect(auditLogs).toHaveLength(0);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/approve`)
      .set('Authorization', authHeaderFor(regular));

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/deposits/:id/reject', () => {
  it('marks the deposit REJECTED, leaves the wallet untouched, and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 50 });
    const deposit = await createTestDeposit(regular, wallet, { amount: 25 });

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/reject`)
      .set('Authorization', authHeaderFor(admin))
      .send({ rejectionReason: 'Screenshot does not match the payment reference' });

    expect(response.status).toBe(200);
    expect(successBody<Deposit>(response.body).data.status).toBe(DepositStatus.REJECTED);

    const walletResponse = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(successBody<Wallet>(walletResponse.body).data.availableBalance).toBe(50);

    const auditLogs = await AuditLog.find({ entity: 'Deposit', entityId: deposit.id }).exec();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe(AUDIT_ACTIONS.DEPOSIT_REJECTED);
  });

  it('rejects a missing rejectionReason with 422', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/reject`)
      .set('Authorization', authHeaderFor(admin))
      .send({});

    expect(response.status).toBe(422);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/reject`)
      .set('Authorization', authHeaderFor(regular))
      .send({ rejectionReason: 'test' });

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const deposit = await createTestDeposit(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/deposits/${deposit.id}/reject`)
      .send({ rejectionReason: 'test' });

    expect(response.status).toBe(401);
  });
});
