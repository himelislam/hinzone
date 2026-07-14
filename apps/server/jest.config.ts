import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/src/**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/src/test/env-setup.ts'],
  // Integration tests each spin up their own mongodb-memory-server instance in
  // beforeAll/afterAll (src/test/db.ts) - running test files serially keeps that
  // simple and avoids any cross-file races, at the cost of some wall-clock time.
  maxWorkers: 1,
  testTimeout: 60000,
};

export default config;
