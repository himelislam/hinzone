import { env } from './environment';

export const databaseConfig = Object.freeze({
  uri: env.MONGODB_URI,
  options: Object.freeze({
    autoIndex: env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 5000,
  }),
  retry: Object.freeze({
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  }),
});
