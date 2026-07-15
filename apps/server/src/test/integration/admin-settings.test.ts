import request from 'supertest';
import { SettingsCategory } from 'shared-types';

import app from '@/app';
import { seedSettings } from '@/database/seed/seed-settings';
import { SETTINGS_DEFAULTS } from '@/database/seed/settings-defaults';
import { AuditLog } from '@/modules/audit-log/audit-log.model';
import { authHeaderFor, createTestAdmin, createTestUser } from '@/test/factories';
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from '@/test/db';
import { successBody } from '@/test/http';

beforeAll(connectTestDatabase);
afterAll(disconnectTestDatabase);
afterEach(clearTestDatabase);

describe('PUT /api/v1/admin/settings/currency', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const response = await request(app)
      .put('/api/v1/admin/settings/currency')
      .send(SETTINGS_DEFAULTS[SettingsCategory.CURRENCY]);

    expect(response.status).toBe(401);
  });

  it('rejects a non-admin user with 403', async () => {
    const { user } = await createTestUser();

    const response = await request(app)
      .put('/api/v1/admin/settings/currency')
      .set('Authorization', authHeaderFor(user))
      .send(SETTINGS_DEFAULTS[SettingsCategory.CURRENCY]);

    expect(response.status).toBe(403);
  });

  it('rejects a structurally invalid payload with 422', async () => {
    const { user: admin } = await createTestAdmin();

    const response = await request(app)
      .put('/api/v1/admin/settings/currency')
      .set('Authorization', authHeaderFor(admin))
      .send({ defaultCurrency: 'BDT' }); // missing every other required field

    expect(response.status).toBe(422);
  });

  it('persists a valid update, refreshes the cache, and records an audit log entry', async () => {
    await seedSettings();
    const { user: admin } = await createTestAdmin();
    const updated = { ...SETTINGS_DEFAULTS[SettingsCategory.CURRENCY], usdToBdtRate: 130 };

    const putResponse = await request(app)
      .put('/api/v1/admin/settings/currency')
      .set('Authorization', authHeaderFor(admin))
      .send(updated);

    expect(putResponse.status).toBe(200);
    expect(successBody(putResponse.body).data).toEqual(updated);

    const getResponse = await request(app).get('/api/v1/settings/currency');
    expect(successBody(getResponse.body).data).toEqual(updated);

    const log = await AuditLog.findOne({
      entity: 'Settings',
      entityId: SettingsCategory.CURRENCY,
    }).exec();
    expect(log?.action).toBe('SETTINGS_UPDATED');
    expect(log?.after).toEqual(updated);
    expect(log?.userId.toString()).toBe(admin.id);
  });
});

describe('PUT /api/v1/admin/settings/deposit', () => {
  it('rejects a deposit payload where the minimum exceeds the maximum', async () => {
    const { user: admin } = await createTestAdmin();
    const invalid = {
      ...SETTINGS_DEFAULTS[SettingsCategory.DEPOSIT],
      minimumDeposit: 999999,
      maximumDeposit: 100000,
    };

    const response = await request(app)
      .put('/api/v1/admin/settings/deposit')
      .set('Authorization', authHeaderFor(admin))
      .send(invalid);

    expect(response.status).toBe(400);
  });

  it('accepts and persists a valid deposit update', async () => {
    await seedSettings();
    const { user: admin } = await createTestAdmin();
    const updated = {
      ...SETTINGS_DEFAULTS[SettingsCategory.DEPOSIT],
      packages: [{ amount: 5000 }],
    };

    const response = await request(app)
      .put('/api/v1/admin/settings/deposit')
      .set('Authorization', authHeaderFor(admin))
      .send(updated);

    expect(response.status).toBe(200);
    expect(successBody(response.body).data).toEqual(updated);
  });
});
