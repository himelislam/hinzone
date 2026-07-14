import request from 'supertest';
import type { AuthResponse } from 'shared-types';

import app from '@/app';
import { authHeaderFor, createTestUser, DEFAULT_TEST_PASSWORD } from '@/test/factories';
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

describe('PUT /api/v1/auth/change-password', () => {
  it('changes the password when the current password is correct', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', authHeaderFor(user))
      .send({
        currentPassword: DEFAULT_TEST_PASSWORD,
        newPassword: 'BrandNewPass1!',
        confirmNewPassword: 'BrandNewPass1!',
      });

    expect(response.status).toBe(200);

    const loginWithNewPassword = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: user.username, password: 'BrandNewPass1!' });
    expect(loginWithNewPassword.status).toBe(200);
  });

  it('revokes every existing session, including the one that made the change', async () => {
    const { user } = await createTestUser();
    const refreshToken = await loginAndGetRefreshToken(user.username);

    await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', authHeaderFor(user))
      .send({
        currentPassword: DEFAULT_TEST_PASSWORD,
        newPassword: 'BrandNewPass1!',
        confirmNewPassword: 'BrandNewPass1!',
      });

    const refreshAttempt = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(refreshAttempt.status).toBe(401);
  });

  it('rejects an incorrect current password', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', authHeaderFor(user))
      .send({
        currentPassword: 'TotallyWrong1!',
        newPassword: 'BrandNewPass1!',
        confirmNewPassword: 'BrandNewPass1!',
      });

    expect(response.status).toBe(401);
  });

  it('rejects mismatched newPassword/confirmNewPassword', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/auth/change-password')
      .set('Authorization', authHeaderFor(user))
      .send({
        currentPassword: DEFAULT_TEST_PASSWORD,
        newPassword: 'BrandNewPass1!',
        confirmNewPassword: 'Different1!',
      });

    expect(response.status).toBe(422);
  });

  it('requires authentication', async () => {
    const response = await request(app).put('/api/v1/auth/change-password').send({
      currentPassword: DEFAULT_TEST_PASSWORD,
      newPassword: 'BrandNewPass1!',
      confirmNewPassword: 'BrandNewPass1!',
    });

    expect(response.status).toBe(401);
  });
});
