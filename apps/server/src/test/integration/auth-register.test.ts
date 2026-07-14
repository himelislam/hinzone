import request from 'supertest';
import type { AuthResponse } from 'shared-types';

import app from '@/app';
import { buildRegisterPayload, createTestUser } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { errorBody, successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns a client-safe user plus tokens', async () => {
    const response = await request(app).post('/api/v1/auth/register').send(buildRegisterPayload());
    const body = successBody<AuthResponse>(response.body);

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user).toMatchObject({ role: 'USER', status: 'ACTIVE' });
    expect((body.data.user as unknown as Record<string, unknown>).password).toBeUndefined();
    expect(body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(body.data.tokens.refreshToken).toEqual(expect.any(String));
  });

  it('rejects a duplicate username', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ username: user.username }));

    expect(response.status).toBe(422);
    expect(errorBody(response.body).errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate phone number', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ phoneNumber: user.phoneNumber }));

    expect(response.status).toBe(422);
  });

  it('rejects mismatched password/confirmPassword', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ confirmPassword: 'SomethingElse123!' }));

    expect(response.status).toBe(422);
  });

  it('rejects a password that does not meet the complexity policy', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ password: 'weak', confirmPassword: 'weak' }));

    expect(response.status).toBe(422);
  });

  it('rejects a referrerId that does not belong to any account', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ referrerId: 'REF999999' }));

    expect(response.status).toBe(400);
    expect(errorBody(response.body).errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('accepts a valid referrerId and links the new user to the sponsor', async () => {
    const { user: sponsor } = await createTestUser();

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(buildRegisterPayload({ referrerId: sponsor.referralId }));

    expect(response.status).toBe(201);
    expect(successBody<AuthResponse>(response.body).data.user.referrerId).toBe(sponsor.id);
  });
});
