import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import {
  rejectWithdrawalSchema,
  withdrawalListQuerySchema,
} from '../withdrawal/withdrawal.validation';

// Pre-composed validate() + schema middlewares, matching the
// admin-deposit.middleware.ts convention. `validateWithdrawalIdParam` is
// redeclared here (rather than imported from withdrawal.middleware.ts) -
// same reasoning as admin-deposit.middleware.ts's own precedent - admin
// middleware stays self-contained rather than depending on the user-facing
// module's file.
export const validateAdminWithdrawalListQuery: RequestHandler = validate({
  query: withdrawalListQuerySchema,
});
export const validateWithdrawalIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
export const validateRejectWithdrawal: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: rejectWithdrawalSchema,
});
