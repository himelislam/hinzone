import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Each integration test file owns its own in-memory MongoDB instance (started in
// its own beforeAll, stopped in its own afterAll) rather than sharing one across
// files - jest.config.ts runs test files serially (maxWorkers: 1) specifically so
// this stays simple and avoids any cross-file data races, at the cost of a couple
// seconds of mongod startup per file.
let mongod: MongoMemoryServer | undefined;

export const connectTestDatabase = async (): Promise<void> => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

export const disconnectTestDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongod?.stop();
  mongod = undefined;
};

export const clearTestDatabase = async (): Promise<void> => {
  const { collections } = mongoose.connection;

  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};
