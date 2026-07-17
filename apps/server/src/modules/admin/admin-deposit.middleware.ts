import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import { depositListQuerySchema, rejectDepositSchema } from '../deposit/deposit.validation';

// Pre-composed validate() + schema middlewares, matching the
// admin-wallet.middleware.ts convention. `validateDepositIdParam` is redeclared
// here (rather than imported from deposit.middleware.ts) - same reasoning as
// admin-wallet.middleware.ts's own validateWalletIdParam - admin middleware
// stays self-contained rather than depending on the user-facing module's file.
export const validateAdminDepositListQuery: RequestHandler = validate({
  query: depositListQuerySchema,
});
export const validateDepositIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
export const validateRejectDeposit: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: rejectDepositSchema,
});
