import request from 'supertest';
import { AccountStatus, UserRole } from 'shared-types';
import type { AuthResponse, User } from 'shared-types';

import app from '@/app';
import {
  authHeaderFor,
  createTestAdmin,
  createTestUser,
  DEFAULT_TEST_PASSWORD,
} from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

// shared/response/response.helpers.ts's paginationResponse() has no `message`
// field, unlike the ApiSuccessResponse envelope successBody() assumes - a
// one-off local shape for this file's list endpoint only.
interface PaginatedBody<T> {
  success: boolean;
  data: T[];
}

const paginatedBody = <T>(body: unknown): PaginatedBody<T> => body as PaginatedBody<T>;

describe('GET /api/v1/admin/users', () => {
  it('lists users for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    const ids = paginatedBody<User>(response.body).data.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining([admin.id, regular.id]));
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app).get('/api/v1/admin/users');

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/admin/users/:id', () => {
  it('returns a single user for an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();

    const response = await request(app)
      .get(`/api/v1/admin/users/${regular.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<User>(response.body).data.id).toBe(regular.id);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const { user: other } = await createTestUser();

    const response = await request(app)
      .get(`/api/v1/admin/users/${other.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });
});

describe('PUT /api/v1/admin/users/:id', () => {
  it('updates a user as an admin', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();

    const response = await request(app)
      .put(`/api/v1/admin/users/${regular.id}`)
      .set('Authorization', authHeaderFor(admin))
      .send({ fullName: 'Admin Edited Name', role: UserRole.ADMIN });

    const body = successBody<User>(response.body);

    expect(response.status).toBe(200);
    expect(body.data.fullName).toBe('Admin Edited Name');
    expect(body.data.role).toBe(UserRole.ADMIN);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const { user: other } = await createTestUser();

    const response = await request(app)
      .put(`/api/v1/admin/users/${other.id}`)
      .set('Authorization', authHeaderFor(user))
      .send({ fullName: 'Should Not Apply' });

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/v1/admin/users/:id/status', () => {
  it('suspends a user and immediately revokes their existing session', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: regular.username, password: DEFAULT_TEST_PASSWORD });
    const refreshToken = successBody<AuthResponse>(loginResponse.body).data.tokens.refreshToken;

    const statusResponse = await request(app)
      .patch(`/api/v1/admin/users/${regular.id}/status`)
      .set('Authorization', authHeaderFor(admin))
      .send({ status: AccountStatus.SUSPENDED });

    expect(statusResponse.status).toBe(200);
    expect(successBody<User>(statusResponse.body).data.status).toBe(AccountStatus.SUSPENDED);

    const refreshAttempt = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshAttempt.status).toBe(401);

    const loginAttempt = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: regular.username, password: DEFAULT_TEST_PASSWORD });
    expect(loginAttempt.status).toBe(401);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const { user: other } = await createTestUser();

    const response = await request(app)
      .patch(`/api/v1/admin/users/${other.id}/status`)
      .set('Authorization', authHeaderFor(user))
      .send({ status: AccountStatus.SUSPENDED });

    expect(response.status).toBe(403);
  });
});

describe('DELETE /api/v1/admin/users/:id', () => {
  it('soft-deletes a user and blocks them from signing in', async () => {
    const { user: admin } = await createTestAdmin();
    const { user: regular } = await createTestUser();

    const response = await request(app)
      .delete(`/api/v1/admin/users/${regular.id}`)
      .set('Authorization', authHeaderFor(admin));

    expect(response.status).toBe(200);
    expect(successBody<User>(response.body).data.status).toBe(AccountStatus.BLOCKED);

    const loginAttempt = await request(app)
      .post('/api/v1/auth/login')
      .send({ login: regular.username, password: DEFAULT_TEST_PASSWORD });
    expect(loginAttempt.status).toBe(401);
  });

  it('rejects a regular user with 403', async () => {
    const { user } = await createTestUser();
    const { user: other } = await createTestUser();

    const response = await request(app)
      .delete(`/api/v1/admin/users/${other.id}`)
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(403);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const { user } = await createTestUser();

    const response = await request(app).delete(`/api/v1/admin/users/${user.id}`);

    expect(response.status).toBe(401);
  });
});
