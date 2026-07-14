// Runs once per test file, before that file's module graph (and therefore
// config/environment.ts's top-level parseEnvironment() call) is evaluated -
// without this, importing anything that transitively pulls in config/environment
// would throw immediately in a test process that has no real .env file.
process.env.NODE_ENV = 'test';
process.env.SERVER_URL ??= 'http://localhost:5000';
process.env.CLIENT_URL ??= 'http://localhost:5173';
// Overwritten per-test-file by test/db.ts once the in-memory MongoDB instance is
// up - this placeholder only exists to satisfy the schema at import time.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/test-placeholder';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
process.env.CLOUDINARY_CLOUD_NAME ??= 'test-cloud';
process.env.CLOUDINARY_API_KEY ??= 'test-key';
process.env.CLOUDINARY_API_SECRET ??= 'test-secret';
// A single integration test file legitimately fires more than 10 requests at a
// rate-limited auth endpoint (e.g. 5+ login attempts to exercise lockout, across
// several `it()` blocks) - all from the same in-process "IP". The rate limiter
// itself is covered by its own live verification (Task P); raising the ceiling
// here keeps that unrelated concern from making these tests flaky.
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS ??= '1000';
