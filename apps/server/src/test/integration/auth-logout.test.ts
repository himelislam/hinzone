import request from 'supertest';
import type { AuthResponse } from 'shared-types';

import app from '@/app';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

const loginAndGetRefreshToken = async (username: string): Promise<string> => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ login: username, password: DEFAULT_TEST_PASSWORD });

  return successBody<AuthResponse>(response.body).data.tokens.refreshToken;
};

describe('POST /api/v1/auth/logout', () => {
  it('logs out successfully with a valid refresh token', async () => {
    const { user } = await createTestUser();
    const refreshToken = await loginAndGetRefreshToken(user.username);

    const response = await request(app).post('/api/v1/auth/logout').send({ refreshToken });

    expect(response.status).toBe(200);
    expect(successBody<null>(response.body).success).toBe(true);
  });

  it('revokes the refresh token so it can no longer be used to refresh', async () => {
    const { user } = await createTestUser();
    const refreshToken = await loginAndGetRefreshToken(user.username);

    await request(app).post('/api/v1/auth/logout').send({ refreshToken });

    const refreshAttempt = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(refreshAttempt.status).toBe(401);
  });

  it('is idempotent for an unknown or already-revoked token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'some-token-that-was-never-issued' });

    expect(response.status).toBe(200);
  });

  it('rejects a missing refreshToken field', async () => {
    const response = await request(app).post('/api/v1/auth/logout').send({});

    expect(response.status).toBe(422);
  });
});
