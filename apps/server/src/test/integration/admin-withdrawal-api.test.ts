import request from 'supertest';
import { WithdrawalStatus } from 'shared-types';
import type { Wallet, Withdrawal } from 'shared-types';

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
  createEligibleApprovedDeposit,
  createTestAdmin,
  createTestUser,
  createTestWallet,
  createTestWithdrawal,
} from '@/test/factories';
import { errorBody, paginatedBody, successBody } from '@/test/http';

// PATCH /admin/withdrawals/:id/complete calls walletService.debit, which
// opens a real MongoDB session/transaction - see test/db-transactional.ts.
// The read-only list/get and the approve/reject/processing endpoints
// (single-document updates, no transaction) work fine against the same
// replica-set-backed connection, so the whole file shares one beforeAll -
// same reasoning as admin-deposit-api.test.ts.
jest.setTimeout(30000);

beforeAll(connectTransactionalTestDatabase);
afterAll(disconnectTransactionalTestDatabase);
afterEach(clearTestDatabase);

describe('GET /api/v1/admin/withdrawals', () => {
  it('lists withdrawals across users for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .get('/api/v1/admin/withdrawals')
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const ids = paginatedBody<Withdrawal>(response.body).data.map((item) => item.id);
    expect(ids).toContain(withdrawal.id);
  });

  it('filters by payment method', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    await createTestWithdrawal(regular, wallet, { paymentMethod: 'bKash' });
    await createTestWithdrawal(regular, wallet, { paymentMethod: 'Nagad' });

    const response = await request(app)
      .get('/api/v1/admin/withdrawals?paymentMethod=Nagad')
      .set('Authorization', authHeaderFor(admin));

    const items = paginatedBody<Withdrawal>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.paymentMethod).toBe('Nagad');
  });

  it('filters by status', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    await createTestWithdrawal(regular, wallet, { status: WithdrawalStatus.PENDING });
    await createTestWithdrawal(regular, wallet, { status: WithdrawalStatus.APPROVED });

    const response = await request(app)
      .get('/api/v1/admin/withdrawals?status=APPROVED')
      .set('Authorization', authHeaderFor(admin));

    const items = paginatedBody<Withdrawal>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('APPROVED');
  });

  it('filters by userId, scoping the cross-user list to one submitter', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: userA } = await createTestUser();
    const { user: userB } = await createTestUser();
    const walletA = await createTestWallet(userA);
    const walletB = await createTestWallet(userB);
    const withdrawalA = await createTestWithdrawal(userA, walletA);
    await createTestWithdrawal(userB, walletB);

    const response = await request(app)
      .get(`/api/v1/admin/withdrawals?userId=${userA.id}`)
      .set('Authorization', authHeaderFor(admin));

    const items = paginatedBody<Withdrawal>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(withdrawalA.id);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/admin/withdrawals')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/admin/withdrawals');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/admin/withdrawals/:id', () => {
  it('returns a single withdrawal for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .get(`/api/v1/admin/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Withdrawal>(response.body).data.id).toBe(withdrawal.id);
  });

  it('reports waitingPeriodSatisfied: false for a user with no approved deposit yet', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .get(`/api/v1/admin/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(successBody<Withdrawal>(response.body).data.waitingPeriodSatisfied).toBe(false);
  });

  it('reports waitingPeriodSatisfied: true once the waiting period has elapsed', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    await createEligibleApprovedDeposit(regular, wallet, 20);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .get(`/api/v1/admin/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(successBody<Withdrawal>(response.body).data.waitingPeriodSatisfied).toBe(true);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .get(`/api/v1/admin/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(regular));

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/withdrawals/:id/approve', () => {
  it('marks the withdrawal APPROVED without touching the wallet, and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 5000 });
    const withdrawal = await createTestWithdrawal(regular, wallet, { amount: 1000 });

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/approve`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const data = successBody<Withdrawal>(response.body).data;
    expect(data.status).toBe(WithdrawalStatus.APPROVED);

    const walletResponse = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(successBody<Wallet>(walletResponse.body).data.availableBalance).toBe(5000);

    const auditLogs = await AuditLog.find({
      entity: 'Withdrawal',
      entityId: withdrawal.id,
    }).exec();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe(AUDIT_ACTIONS.WITHDRAWAL_APPROVED);
    expect(auditLogs[0]?.userId.toString()).toBe(admin.id);
  });

  it('rejects approving a withdrawal that is no longer PENDING, writing no audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet, {
      status: WithdrawalStatus.REJECTED,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/approve`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('WITHDRAWAL_INVALID_TRANSITION');

    const auditLogs = await AuditLog.find({
      entity: 'Withdrawal',
      entityId: withdrawal.id,
    }).exec();
    expect(auditLogs).toHaveLength(0);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/approve`)
      .set('Authorization', authHeaderFor(regular));

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/withdrawals/:id/reject', () => {
  it('marks the withdrawal REJECTED, leaves the wallet untouched, and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 5000 });
    const withdrawal = await createTestWithdrawal(regular, wallet, { amount: 1000 });

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/reject`)
      .set('Authorization', authHeaderFor(admin))
      .send({ rejectionReason: 'Receiver account could not be verified' });

    expect(response.status).toBe(200);
    expect(successBody<Withdrawal>(response.body).data.status).toBe(WithdrawalStatus.REJECTED);

    const walletResponse = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(successBody<Wallet>(walletResponse.body).data.availableBalance).toBe(5000);

    const auditLogs = await AuditLog.find({
      entity: 'Withdrawal',
      entityId: withdrawal.id,
    }).exec();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe(AUDIT_ACTIONS.WITHDRAWAL_REJECTED);
  });

  it('rejects a missing rejectionReason with 422', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/reject`)
      .set('Authorization', authHeaderFor(admin))
      .send({});

    expect(response.status).toBe(422);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/reject`)
      .set('Authorization', authHeaderFor(regular))
      .send({ rejectionReason: 'test' });

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/reject`)
      .send({ rejectionReason: 'test' });

    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/v1/admin/withdrawals/:id/processing', () => {
  it('moves an APPROVED withdrawal to PROCESSING', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/processing`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Withdrawal>(response.body).data.status).toBe(WithdrawalStatus.PROCESSING);
  });

  it('rejects moving a PENDING withdrawal directly to PROCESSING', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/processing`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('WITHDRAWAL_INVALID_TRANSITION');
  });
});

describe('PATCH /api/v1/admin/withdrawals/:id/complete', () => {
  it('debits the wallet by the gross amount, marks the withdrawal COMPLETED, and writes an audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 5000 });
    const withdrawal = await createTestWithdrawal(regular, wallet, {
      status: WithdrawalStatus.APPROVED,
      amount: 1000,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/complete`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<Withdrawal>(response.body).data.status).toBe(WithdrawalStatus.COMPLETED);

    const walletResponse = await request(app)
      .get(`/api/v1/admin/wallets/${wallet.id}`)
      .set('Authorization', authHeaderFor(admin));
    expect(successBody<Wallet>(walletResponse.body).data.availableBalance).toBe(4000);

    const auditLogs = await AuditLog.find({
      entity: 'Withdrawal',
      entityId: withdrawal.id,
    }).exec();
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0]?.action).toBe(AUDIT_ACTIONS.WITHDRAWAL_COMPLETED);
    // Previous/New Balance (tasks/phase-06.md's Audit Logs) - read straight
    // off the ledger Transaction walletService.debit already created, not
    // re-fetched.
    expect(auditLogs[0]?.before).toMatchObject({ balance: 5000 });
    expect(auditLogs[0]?.after).toMatchObject({ balance: 4000 });
  });

  it('rejects completing a withdrawal that is neither APPROVED nor PROCESSING, writing no audit log', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular, { availableBalance: 5000 });
    const withdrawal = await createTestWithdrawal(regular, wallet);

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/complete`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('WITHDRAWAL_INVALID_TRANSITION');

    const auditLogs = await AuditLog.find({
      entity: 'Withdrawal',
      entityId: withdrawal.id,
    }).exec();
    expect(auditLogs).toHaveLength(0);
  });

  it('rejects a regular user with 403', async () => {
    const { user: regular } = await createTestUser();
    const wallet = await createTestWallet(regular);
    const withdrawal = await createTestWithdrawal(regular, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    const response = await request(app)
      .patch(`/api/v1/admin/withdrawals/${withdrawal.id}/complete`)
      .set('Authorization', authHeaderFor(regular));

    expect(response.status).toBe(403);
  });
});
