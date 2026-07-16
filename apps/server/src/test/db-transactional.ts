import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { seedSettings } from '@/database/seed/seed-settings';

// Single-node replica set variant of test/db.ts's connectTestDatabase. Plain
// MongoDB transactions require a replica set - a standalone MongoMemoryServer
// (test/db.ts) rejects session.withTransaction() outright - so this is reserved
// for test files that actually exercise walletService.credit/debit or the admin
// adjustment endpoint that calls them (slower to start than test/db.ts's
// standalone instance, hence not the default for every file). clearTestDatabase
// from test/db.ts is reused as-is: it only operates on
// mongoose.connection.collections, which works identically regardless of which
// MongoDB variant is connected.
let replSet: MongoMemoryReplSet | undefined;

export const connectTransactionalTestDatabase = async (): Promise<void> => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  await seedSettings();
};

export const disconnectTransactionalTestDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await replSet?.stop();
  replSet = undefined;
};

export { clearTestDatabase } from './db';
