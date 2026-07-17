import request from 'supertest';
import { DepositStatus } from 'shared-types';
import type { Deposit } from 'shared-types';

import app from '@/app';
import { uploadImage } from '@/shared/helpers/upload-image';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import {
  authHeaderFor,
  createTestDeposit,
  createTestUser,
  createTestWallet,
} from '@/test/factories';
import { errorBody, successBody } from '@/test/http';

// None of these endpoints call walletService.credit/debit (only the admin
// approve endpoint does), so this file uses the standard, faster standalone
// test/db.ts helper rather than test/db-transactional.ts - same reasoning as
// wallet-api.test.ts. uploadImage is mocked to avoid a real Cloudinary call.
jest.mock('@/shared/helpers/upload-image');

const FAKE_SCREENSHOT_URL = 'https://res.cloudinary.com/test-cloud/image/upload/mock-deposit.jpg';
const mockedUploadImage = jest.mocked(uploadImage);

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

beforeEach(() => {
  mockedUploadImage.mockResolvedValue(FAKE_SCREENSHOT_URL);
});

interface PaginatedBody<T> {
  success: boolean;
  data: T[];
}

const paginatedBody = <T>(body: unknown): PaginatedBody<T> => body as PaginatedBody<T>;

// Every multipart request below matches the seeded DEPOSIT settings defaults
// (settings-defaults.ts: packages [3000, 6000, 12000], paymentMethods
// ['bKash', 'Nagad']) unless a test overrides a field to exercise a rejection.
const attachValidDeposit = (
  agent: request.Test,
  overrides: Partial<{
    packageAmount: string;
    paymentMethod: string;
    senderAccountNumber: string;
    paymentReference: string;
    withScreenshot: boolean;
  }> = {},
): request.Test => {
  const fields = {
    packageAmount: '3000',
    paymentMethod: 'bKash',
    senderAccountNumber: '01712345678',
    paymentReference: 'TXN-INTEGRATION-001',
    withScreenshot: true,
    ...overrides,
  };

  let req = agent
    .field('packageAmount', fields.packageAmount)
    .field('paymentMethod', fields.paymentMethod)
    .field('senderAccountNumber', fields.senderAccountNumber)
    .field('paymentReference', fields.paymentReference);

  if (fields.withScreenshot) {
    req = req.attach('screenshot', Buffer.from('fake-image-data'), {
      filename: 'screenshot.jpg',
      contentType: 'image/jpeg',
    });
  }

  return req;
};

describe('POST /api/v1/deposits', () => {
  it('creates a PENDING deposit from a valid multipart request', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    const response = await attachValidDeposit(
      request(app).post('/api/v1/deposits').set('Authorization', authHeaderFor(user)),
    );

    expect(response.status).toBe(201);
    const data = successBody<Deposit>(response.body).data;
    expect(data.status).toBe(DepositStatus.PENDING);
    expect(data.amount).toBe(3000);
    expect(data.screenshotUrl).toBe(FAKE_SCREENSHOT_URL);
  });

  it('rejects a request with no screenshot attached', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    const response = await attachValidDeposit(
      request(app).post('/api/v1/deposits').set('Authorization', authHeaderFor(user)),
      { withScreenshot: false },
    );

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects a missing required field', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    const response = await request(app)
      .post('/api/v1/deposits')
      .set('Authorization', authHeaderFor(user))
      .field('packageAmount', '3000')
      .field('paymentMethod', 'bKash')
      .field('senderAccountNumber', '01712345678')
      .attach('screenshot', Buffer.from('fake-image-data'), {
        filename: 'screenshot.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects an amount that does not match any configured package', async () => {
    const { user } = await createTestUser();
    await createTestWallet(user);

    const response = await attachValidDeposit(
      request(app).post('/api/v1/deposits').set('Authorization', authHeaderFor(user)),
      { packageAmount: '4500' },
    );

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await attachValidDeposit(request(app).post('/api/v1/deposits'));

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/deposits', () => {
  it("lists the caller's own deposits, paginated", async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestDeposit(user, wallet, { amount: 3000 });
    await createTestDeposit(user, wallet, { amount: 6000 });

    const response = await request(app)
      .get('/api/v1/deposits')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(paginatedBody<Deposit>(response.body).data).toHaveLength(2);
  });

  it('filters by status', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestDeposit(user, wallet, { status: DepositStatus.PENDING });
    await createTestDeposit(user, wallet, { status: DepositStatus.APPROVED });

    const response = await request(app)
      .get('/api/v1/deposits?status=APPROVED')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Deposit>(response.body).data;
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe('APPROVED');
  });

  it('sorts by highestAmount', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    await createTestDeposit(user, wallet, { amount: 3000 });
    await createTestDeposit(user, wallet, { amount: 12000 });

    const response = await request(app)
      .get('/api/v1/deposits?sortBy=highestAmount')
      .set('Authorization', authHeaderFor(user));

    const items = paginatedBody<Deposit>(response.body).data;
    expect(items[0]?.amount).toBe(12000);
  });

  it("only returns the caller's own deposits, never another user's", async () => {
    const { user: userA } = await createTestUser();
    const { user: userB } = await createTestUser();
    const walletA = await createTestWallet(userA);
    const walletB = await createTestWallet(userB);
    await createTestDeposit(userA, walletA);
    await createTestDeposit(userB, walletB);

    const response = await request(app)
      .get('/api/v1/deposits')
      .set('Authorization', authHeaderFor(userA));

    expect(paginatedBody<Deposit>(response.body).data).toHaveLength(1);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/deposits');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/deposits/:id', () => {
  it('returns a single deposit belonging to the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const deposit = await createTestDeposit(user, wallet);

    const response = await request(app)
      .get(`/api/v1/deposits/${deposit.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<Deposit>(response.body).data.id).toBe(deposit.id);
  });

  it("returns 404 (not 403) for another user's deposit - no existence leak", async () => {
    const { user: owner } = await createTestUser();
    const { user: intruder } = await createTestUser();
    const wallet = await createTestWallet(owner);
    const deposit = await createTestDeposit(owner, wallet);

    const response = await request(app)
      .get(`/api/v1/deposits/${deposit.id}`)
      .set('Authorization', authHeaderFor(intruder));

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/v1/deposits/:id', () => {
  it('cancels a PENDING deposit owned by the caller', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const deposit = await createTestDeposit(user, wallet);

    const response = await request(app)
      .delete(`/api/v1/deposits/${deposit.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<Deposit>(response.body).data.status).toBe(DepositStatus.CANCELLED);
  });

  it('rejects cancelling a deposit that is no longer PENDING', async () => {
    const { user } = await createTestUser();
    const wallet = await createTestWallet(user);
    const deposit = await createTestDeposit(user, wallet, { status: DepositStatus.APPROVED });

    const response = await request(app)
      .delete(`/api/v1/deposits/${deposit.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('DEPOSIT_NOT_PENDING');
  });
});
