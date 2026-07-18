import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import { createWithdrawalSchema, withdrawalListQuerySchema } from './withdrawal.validation';

// Pre-composed validate() + schema middlewares, matching the
// deposit.middleware.ts convention. Explicit RequestHandler annotations
// avoid TS2742.
export const validateCreateWithdrawal: RequestHandler = validate({ body: createWithdrawalSchema });
export const validateWithdrawalListQuery: RequestHandler = validate({
  query: withdrawalListQuerySchema,
});
export const validateWithdrawalIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
