import request from 'supertest';
import type { AuthResponse, AuthTokens } from 'shared-types';

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

describe('POST /api/v1/auth/refresh', () => {
  it('issues a new token pair for a valid refresh token', async () => {
    const { user } = await createTestUser();
    const refreshToken = await loginAndGetRefreshToken(user.username);

    const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    const body = successBody<AuthTokens>(response.body);

    expect(response.status).toBe(200);
    expect(body.data.accessToken).toEqual(expect.any(String));
    expect(body.data.refreshToken).toEqual(expect.any(String));
    expect(body.data.refreshToken).not.toBe(refreshToken);
  });

  it('rejects a malformed refresh token', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' });

    expect(response.status).toBe(401);
  });

  it('rejects reuse of a refresh token after it has been rotated', async () => {
    const { user } = await createTestUser();
    const refreshToken = await loginAndGetRefreshToken(user.username);

    const first = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(first.status).toBe(200);

    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(reuse.status).toBe(401);
  });

  it('rejects a missing refreshToken field', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({});

    expect(response.status).toBe(422);
  });
});
