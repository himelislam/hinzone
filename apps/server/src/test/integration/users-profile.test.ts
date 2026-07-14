import request from 'supertest';
import type { User } from 'shared-types';

import app from '@/app';
import { authHeaderFor, createTestUser, uniquePhoneNumber } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

describe('GET /api/v1/users/profile', () => {
  it("returns the authenticated user's own profile", async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', authHeaderFor(user));

    expect(response.status).toBe(200);
    expect(successBody<User>(response.body).data.id).toBe(user.id);
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/v1/users/profile');

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/v1/users/profile', () => {
  it('updates fullName and phoneNumber', async () => {
    const { user } = await createTestUser();
    const newPhoneNumber = uniquePhoneNumber();

    const response = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', authHeaderFor(user))
      .send({ fullName: 'Updated Name', phoneNumber: newPhoneNumber });

    const body = successBody<User>(response.body);

    expect(response.status).toBe(200);
    expect(body.data.fullName).toBe('Updated Name');
    expect(body.data.phoneNumber).toBe(newPhoneNumber);
  });

  it('rejects a phone number already used by another account', async () => {
    const { user: otherUser } = await createTestUser();
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', authHeaderFor(user))
      .send({ phoneNumber: otherUser.phoneNumber });

    expect(response.status).toBe(422);
  });

  it('rejects an invalid phone number format', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', authHeaderFor(user))
      .send({ phoneNumber: 'not-a-phone-number' });

    expect(response.status).toBe(422);
  });

  it('ignores an attempt to set profileImage directly through the body', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', authHeaderFor(user))
      .send({ fullName: 'Updated Name', profileImage: 'https://evil.example.com/x.png' });

    expect(response.status).toBe(200);
    expect(successBody<User>(response.body).data.profileImage).toBeUndefined();
  });

  it('requires authentication', async () => {
    const response = await request(app).put('/api/v1/users/profile').send({ fullName: 'X' });

    expect(response.status).toBe(401);
  });
});
