import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import {
  adminWalletListQuerySchema,
  walletAdjustmentSchema,
  walletUserIdParamSchema,
} from '../wallet/wallet.validation';

// Pre-composed validate() + schema middlewares, matching the
// admin-users.middleware.ts convention. Explicit RequestHandler annotations
// avoid TS2742.
export const validateAdminWalletListQuery: RequestHandler = validate({
  query: adminWalletListQuerySchema,
});
export const validateWalletIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
export const validateWalletUserIdParam: RequestHandler = validate({
  params: walletUserIdParamSchema,
});
export const validateWalletAdjustment: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: walletAdjustmentSchema,
});
