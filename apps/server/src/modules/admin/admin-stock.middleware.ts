import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import {
  adminStockListQuerySchema,
  changeStockStatusSchema,
  createStockSchema,
  updateStockPriceSchema,
  updateStockSchema,
} from '../stock/stock.validation';

// Pre-composed validate() + schema middlewares, matching the
// admin-deposit.middleware.ts/admin-withdrawal.middleware.ts convention.
// `validateStockIdParam` is redeclared here (rather than imported from
// stock.middleware.ts) - same self-contained-admin-middleware precedent
// those two files already set - admin middleware stays self-contained rather
// than depending on the user-facing module's file.
export const validateAdminStockListQuery: RequestHandler = validate({
  query: adminStockListQuerySchema,
});
export const validateStockIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
export const validateCreateStock: RequestHandler = validate({ body: createStockSchema });
export const validateUpdateStock: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: updateStockSchema,
});
export const validateChangeStockStatus: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: changeStockStatusSchema,
});
export const validateUpdateStockPrice: RequestHandler = validate({
  params: mongoIdParamSchema,
  body: updateStockPriceSchema,
});
