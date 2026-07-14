import request from 'supertest';
import { AccountStatus } from 'shared-types';
import type { AuthResponse } from 'shared-types';

import app from '@/app';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { errorBody, successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

const login = (payload: { login: string; password: string }): request.Test =>
  request(app).post('/api/v1/auth/login').send(payload);

describe('POST /api/v1/auth/login', () => {
  it('logs in with the correct username and password', async () => {
    const { user } = await createTestUser();

    const response = await login({ login: user.username, password: DEFAULT_TEST_PASSWORD });
    const body = successBody<AuthResponse>(response.body);

    expect(response.status).toBe(200);
    expect(body.data.user.id).toBe(user.id);
    expect(body.data.tokens.accessToken).toEqual(expect.any(String));
  });

  it('logs in with a phone number', async () => {
    const { user } = await createTestUser();

    const response = await login({ login: user.phoneNumber, password: DEFAULT_TEST_PASSWORD });

    expect(response.status).toBe(200);
  });

  it('rejects an unknown identifier with a generic message', async () => {
    const response = await login({ login: 'nobody-registered', password: 'WhoKnows123!' });

    expect(response.status).toBe(401);
    expect(errorBody(response.body).message).toBe('Invalid credentials.');
  });

  it('rejects the wrong password with the same generic message as an unknown identifier', async () => {
    const { user } = await createTestUser();

    const response = await login({ login: user.username, password: 'WrongPassword1!' });

    expect(response.status).toBe(401);
    expect(errorBody(response.body).message).toBe('Invalid credentials.');
  });

  it('rejects a suspended account', async () => {
    const { user } = await createTestUser({ status: AccountStatus.SUSPENDED });

    const response = await login({ login: user.username, password: DEFAULT_TEST_PASSWORD });

    expect(response.status).toBe(401);
  });

  it('locks the account after the configured number of failed attempts, then rejects even the correct password', async () => {
    const { user } = await createTestUser();

    // MAX_LOGIN_ATTEMPTS defaults to 5 (config/environment.ts) - sequential on
    // purpose, each attempt must increment the same counter deterministically.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login({ login: user.username, password: 'WrongPassword1!' });
    }

    const lockedResponse = await login({ login: user.username, password: DEFAULT_TEST_PASSWORD });

    expect(lockedResponse.status).toBe(401);
    expect(errorBody(lockedResponse.body).message).toMatch(/temporarily locked/i);
  });

  it('does not lock the account before the threshold is reached', async () => {
    const { user } = await createTestUser();

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await login({ login: user.username, password: 'WrongPassword1!' });
    }

    const response = await login({ login: user.username, password: DEFAULT_TEST_PASSWORD });

    expect(response.status).toBe(200);
  });
});
