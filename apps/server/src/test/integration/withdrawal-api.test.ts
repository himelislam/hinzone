import request from 'supertest';
import { DepositStatus, SettingsCategory, WithdrawalStatus } from 'shared-types';
import type { Withdrawal } from 'shared-types';

import app from '@/app';
import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { settingsService } from '@/modules/settings/settings.service';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import {
  authHeaderFor,
  createEligibleApprovedDeposit,
  createTestAdmin,
  createTestDeposit,
  createTestUser,
  createTestWallet,
  createTestWithdrawal,
} from '@/test/factories';
import { errorBody, paginatedBody, successBody } from '@/test/http';

// None of these endpoints call walletService.credit/debit (only the admin
// complete endpoint does), so this file uses the standard, faster standalone
// test/db.ts helper rather than test/db-transactional.ts - same reasoning as
// deposit-api.test.ts. (Corrects tasks/breakdown/phase-06-tasks.md task 31's
// own note that this file needs the transactional variant - re-checked
// against withdrawal.service.ts/withdrawal.controller.ts: neither
// createWithdrawal nor any other user-facing route calls walletService.debit,
// only completeWithdrawal, an admin-only endpoint, does.)
beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

const VALID_CREATE_BODY = {
  amount: 5000,
  paymentMethod: 'bKash',
  receiverAccountNumber: '01712345678',
  accountHolderName: 'Test User',
};

describe('POST /api/v1/withdrawals', () => {
  it('creates a PENDING withdrawal for an eligible user', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet);

    const response = await request(app)
      .post('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user))
      .send(VALID_CREATE_BODY);

    expect(response.status).toBe(201);
    const data = successBody<Withdrawal>(response.body).data;
    expect(data.status).toBe(WithdrawalStatus.PENDING);
    expect(data.amount).toBe(5000);
    expect(data.withdrawalFee).toBe(250);
    expect(data.netAmount).toBe(4750);
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

    try {
      const response = await request(app)
        .post('/api/v1/withdrawals')
        .set('Authorization', authHeaderFor(user))
        .send(VALID_CREATE_BODY);

      expect(response.status).toBe(400);
      expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
    } finally {
      await settingsService.updateWithdrawal(
        SETTINGS_DEFAULTS[SettingsCategory.WITHDRAWAL],
        admin.id,
      );
    }
  });

  it('rejects an amount below the configured minimum', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet);

    const response = await request(app)
      .post('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user))
      .send({ ...VALID_CREATE_BODY, amount: 500 });

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('rejects a disallowed payment method', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet);

    const response = await request(app)
      .post('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user))
      .send({ ...VALID_CREATE_BODY, paymentMethod: 'Bank Transfer' });

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('rejects a withdrawal larger than the available balance', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 1000 });
    await createEligibleApprovedDeposit(user, wallet);

    const response = await request(app)
      .post('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user))
      .send({ ...VALID_CREATE_BODY, amount: 5000 });

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('rejects when the waiting period has not been satisfied', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createTestDeposit(user, wallet, { status: DepositStatus.APPROVED });

    const response = await request(app)
      .post('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user))
      .send(VALID_CREATE_BODY);

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('rejects a missing required field with 422', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user, { availableBalance: 10000 });
    await createEligibleApprovedDeposit(user, wallet);

    const response = await request(app)
      .post('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user))
      .send({
        paymentMethod: 'bKash',
        receiverAccountNumber: '01712345678',
        accountHolderName: 'Test User',
      });

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).post('/api/v1/withdrawals').send(VALID_CREATE_BODY);

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/withdrawals', () => {
  it("lists the caller's own withdrawals, paginated", async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestWithdrawal(user, wallet, { amount: 1000 });
    await createTestWithdrawal(user, wallet, { amount: 2000 });

    const response = await request(app)
      .get('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(paginatedBody<Withdrawal>(response.body).data).toHaveLength(2);
  });

  it('filters by status', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestWithdrawal(user, wallet, { status: WithdrawalStatus.PENDING });
    await createTestWithdrawal(user, wallet, { status: WithdrawalStatus.APPROVED });

    const response = await request(app)
      .get('/api/v1/withdrawals?status=APPROVED')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Withdrawal>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('APPROVED');
  });

  it('sorts by highestAmount', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestWithdrawal(user, wallet, { amount: 1000 });
    await createTestWithdrawal(user, wallet, { amount: 3000 });

    const response = await request(app)
      .get('/api/v1/withdrawals?sortBy=highestAmount')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Withdrawal>(response.body).data;
    expect(items[0]?.amount).toBe(3000);
  });

  it("only returns the caller's own withdrawals, never another user's", async () => {
    const { user: userA } = await createTestUser();
    const { user: userB } = await createTestUser();
    const walletA = await createTestWallet(userA);
    const walletB = await createTestWallet(userB);
    await createTestWithdrawal(userA, walletA);
    await createTestWithdrawal(userB, walletB);

    const response = await request(app)
      .get('/api/v1/withdrawals')
      .set('Authorization', authHeaderFor(userA));

    expect(paginatedBody<Withdrawal>(response.body).data).toHaveLength(1);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/withdrawals');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/withdrawals/:id', () => {
  it('returns a single withdrawal belonging to the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const withdrawal = await createTestWithdrawal(user, wallet);

    const response = await request(app)
      .get(`/api/v1/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<Withdrawal>(response.body).data.id).toBe(withdrawal.id);
  });

  it("returns 404 (not 403) for another user's withdrawal - no existence leak", async () => {
    const { user: owner } = await createTestUser();
    const { user: intruder } = await createTestUser();
    const wallet = await createTestWallet(owner);
    const withdrawal = await createTestWithdrawal(owner, wallet);

    const response = await request(app)
      .get(`/api/v1/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(intruder));

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/v1/withdrawals/:id', () => {
  it('cancels a PENDING withdrawal owned by the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const withdrawal = await createTestWithdrawal(user, wallet);

    const response = await request(app)
      .delete(`/api/v1/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<Withdrawal>(response.body).data.status).toBe(WithdrawalStatus.CANCELLED);
  });

  it('rejects cancelling a withdrawal that is no longer PENDING', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const withdrawal = await createTestWithdrawal(user, wallet, {
      status: WithdrawalStatus.APPROVED,
    });

    const response = await request(app)
      .delete(`/api/v1/withdrawals/${withdrawal.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('WITHDRAWAL_INVALID_TRANSITION');
  });
});
