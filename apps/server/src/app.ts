import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Application } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { corsOptions } from '@/config/cors';
import { env } from '@/config/environment';
import { helmetOptions } from '@/config/helmet';
import { errorHandler } from '@/middlewares/errorHandler';
import { sanitizeInput } from '@/middlewares/sanitizeInput';
import { apiRouter } from '@/routes';
import { healthRouter } from '@/routes/health.routes';
import { NotFoundError } from '@/shared/errors';
import { morganStream } from '@/shared/logger';

const app: Application = express();

// Governs both req.ip (which authRateLimiter keys on) and req.secure - see
// config/environment.ts's TRUST_PROXY_HOPS for why this must stay in sync with
// the actual deployment topology.
app.set('trust proxy', env.TRUST_PROXY_HOPS);

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json());
// Auth tokens are never cookie-based here - modules/auth returns both the access
// and refresh token in the JSON response body, and the client resubmits the
// refresh token explicitly in the body of POST /auth/refresh and /auth/logout
// (see apps/client/src/utils/token-storage.ts for the client-side rationale).
// That means docs/18-security.md #27's cookie-flag/CSRF requirements
// (httpOnly/secure/sameSite, CSRF tokens) don't apply - "If JWT Authorization
// headers are used exclusively, CSRF risk is significantly reduced." This
// middleware is kept mounted only in case a future feature needs to read a
// non-auth cookie; nothing in this codebase currently sets or reads one.
app.use(cookieParser());
app.use(morgan('combined', { stream: morganStream }));
// Must run after express.json() - it sanitizes req.body, which only exists once
// parsed.
app.use(sanitizeInput);

app.use(healthRouter);
app.use('/api/v1', apiRouter);

app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
});

app.use(errorHandler);

export default app;
