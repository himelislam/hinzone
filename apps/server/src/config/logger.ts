import { env } from './environment';

// 'error' under test keeps Jest's output focused on assertion failures instead of
// being buried in per-request http logs from every integration test's supertest
// calls - the file transports still capture everything regardless of level.
const LOG_LEVEL_BY_ENVIRONMENT = {
  production: 'http',
  test: 'error',
  development: 'debug',
} as const;

export const loggerConfig = Object.freeze({
  level: LOG_LEVEL_BY_ENVIRONMENT[env.NODE_ENV],
});
