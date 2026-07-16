import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import { transactionQuerySchema } from './wallet.validation';

// Pre-composed validate() + schema middlewares, matching the users.middleware.ts
// convention. Explicit RequestHandler annotations avoid TS2742.
export const validateTransactionQuery: RequestHandler = validate({ query: transactionQuerySchema });
export const validateTransactionIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
