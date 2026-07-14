import request from 'supertest';
import jsonwebtoken from 'jsonwebtoken';
import type { User } from 'shared-types';

import app from '@/app';
import { jwtConfig } from '@/config/jwt';
import { authHeaderFor, createTestUser } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

describe('GET /api/v1/auth/me', () => {
  it('returns the authenticated user with no password field', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', authHeaderFor(user));

    const body = successBody<User>(response.body);

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(user.id);
    expect(body.data.username).toBe(user.username);
    expect((body.data as unknown as Record<string, unknown>).password).toBeUndefined();
  });

  it('rejects a request with no Authorization header', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
  });

  it('rejects a malformed token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const { user } = await createTestUser();
    const foreignToken = jsonwebtoken.sign(
      { userId: user.id, username: user.username, role: user.role },
      'a-completely-different-secret',
      { expiresIn: '15m' },
    );

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${foreignToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired access token', async () => {
    const { user } = await createTestUser();

    // Fake timers would need to keep advancing for the real HTTP request/response
    // and MongoDB driver machinery below to ever resolve - simplest to just sign a
    // token whose exp claim is already in the past, no clock manipulation needed.
    const expiredToken = jsonwebtoken.sign(
      { userId: user.id, username: user.username, role: user.role },
      jwtConfig.accessSecret,
      { expiresIn: '-1s', algorithm: 'HS256' },
    );

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });
});
