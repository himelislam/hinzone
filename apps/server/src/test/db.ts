import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { seedSettings } from '@/database/seed/seed-settings';

// Each integration test file owns its own in-memory MongoDB instance (started in
// its own beforeAll, stopped in its own afterAll) rather than sharing one across
// files - jest.config.ts runs test files serially (maxWorkers: 1) specifically so
// this stays simple and avoids any cross-file data races, at the cost of a couple
// seconds of mongod startup per file.
let mongod: MongoMemoryServer | undefined;

// Auth now reads JWT expiration, login-attempt lockout, password-reset expiration,
// and password policy from Security Settings (Task H's retrofit) instead of env
// fallbacks, so every test needs the seeded defaults in place before it can
// register/login/reset a password - same as a real deployment needing
// `pnpm run seed:settings` before serving traffic.
export const connectTestDatabase = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await seedSettings();
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod?.stop();
  mongod = undefined;
};

// Settings is deliberately excluded - it's seeded once per test file in
// connectTestDatabase(), not per-test fixture data, so an afterEach(clearTestDatabase)
// mid-file must not wipe it out from under whichever test runs next.
export const clearTestDatabase = async (): Promise<void> => {
  const { collections } = mongoose.connection;

  await Promise.all(
    Object.entries(collections)
      .filter(([name]) => name !== 'settings')
      .map(([, collection]) => collection.deleteMany({})),
  );
};
