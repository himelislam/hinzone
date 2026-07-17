import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import { createDepositSchema, depositListQuerySchema } from './deposit.validation';

// Pre-composed validate() + schema middlewares, matching the wallet.middleware.ts
// convention. Explicit RequestHandler annotations avoid TS2742.
export const validateCreateDeposit: RequestHandler = validate({ body: createDepositSchema });
export const validateDepositListQuery: RequestHandler = validate({ query: depositListQuerySchema });
export const validateDepositIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
