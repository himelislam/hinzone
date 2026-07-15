import request from 'supertest';
import { SettingsCategory } from 'shared-types';

import app from '@/app';
import { seedSettings } from '@/database/seed/seed-settings';
import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(async () => {
  await connectTestDatabase();
  await seedSettings();
});
afterAll(disconnectTestDatabase);

describe('GET /api/v1/settings', () => {
  it('returns every seeded category to an anonymous caller', async () => {
    const response = await request(app).get('/api/v1/settings');

    expect(response.status).toBe(200);
    const data = successBody<Record<SettingsCategory, unknown>>(response.body).data;

    for (const category of Object.values(SettingsCategory)) {
      expect(data[category]).toEqual(SETTINGS_DEFAULTS[category]);
    }
  });
});

describe('GET /api/v1/settings/:category', () => {
  it('returns a single category to an anonymous caller', async () => {
    const response = await request(app).get('/api/v1/settings/currency');

    expect(response.status).toBe(200);
    expect(successBody(response.body).data).toEqual(SETTINGS_DEFAULTS[SettingsCategory.CURRENCY]);
  });

  it('rejects a category that is not one of the ten known values', async () => {
    const response = await request(app).get('/api/v1/settings/not-a-category');

    expect(response.status).toBe(422);
  });
});
