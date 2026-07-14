import request from 'supertest';

import { passwordService } from '@/modules/auth/password.service';
import app from '@/app';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

const GENERIC_MESSAGE =
  'If an account exists with this email, a password reset link has been sent.';

describe('POST /api/v1/auth/forgot-password', () => {
  it('responds with the generic message for a real account', async () => {
    const { user } = await createTestUser({ email: 'known@example.com' });

    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email });

    expect(response.status).toBe(200);
    expect(successBody<null>(response.body).message).toBe(GENERIC_MESSAGE);
  });

  it('responds with the exact same message for an unknown email (anti-enumeration)', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody-registered@example.com' });

    expect(response.status).toBe(200);
    expect(successBody<null>(response.body).message).toBe(GENERIC_MESSAGE);
  });

  it('rejects a malformed email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(422);
  });
});

describe('POST /api/v1/auth/reset-password', () => {
  // The API deliberately never returns the raw reset token (only the generic
  // message above) - passwordService.forgotPassword is called directly here to
  // obtain it, standing in for the email delivery this project has no
  // notification module for yet (docs/07-authentication.md #21).
  const requestResetToken = async (email: string): Promise<string> => {
    const token = await passwordService.forgotPassword(email);

    if (!token) {
      throw new Error('Expected a reset token for a known, eligible account.');
    }

    return token;
  };

  it('resets the password and allows logging in with the new one', async () => {
    const { user } = await createTestUser({ email: 'reset-flow@example.com' });
    const token = await requestResetToken(user.email as string);

    const resetResponse = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      newPassword: 'BrandNewPass1!',
      confirmNewPassword: 'BrandNewPass1!',
    });

    expect(resetResponse.status).toBe(200);

    const oldPasswordLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: user.username, password: DEFAULT_TEST_PASSWORD });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: user.username, password: 'BrandNewPass1!' });
    expect(newPasswordLogin.status).toBe(200);
  });

  it('rejects an invalid token', async () => {
    const response = await request(app).post('/api/v1/auth/reset-password').send({
      token: 'not-a-real-token',
      newPassword: 'BrandNewPass1!',
      confirmNewPassword: 'BrandNewPass1!',
    });

    expect(response.status).toBe(401);
  });

  it('rejects mismatched newPassword/confirmNewPassword', async () => {
    const { user } = await createTestUser({ email: 'mismatch@example.com' });
    const token = await requestResetToken(user.email as string);

    const response = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      newPassword: 'BrandNewPass1!',
      confirmNewPassword: 'SomethingElse1!',
    });

    expect(response.status).toBe(422);
  });

  it('rejects reusing an already-used reset token', async () => {
    const { user } = await createTestUser({ email: 'reuse@example.com' });
    const token = await requestResetToken(user.email as string);

    const first = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      newPassword: 'BrandNewPass1!',
      confirmNewPassword: 'BrandNewPass1!',
    });
    expect(first.status).toBe(200);

    const second = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      newPassword: 'AnotherNewPass1!',
      confirmNewPassword: 'AnotherNewPass1!',
    });

    expect(second.status).toBe(401);
  });
});
