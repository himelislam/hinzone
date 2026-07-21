import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';
import { mongoIdParamSchema } from '@/shared/validators/mongo-id.validator';

import { stockHistoryQuerySchema, stockListQuerySchema } from './stock.validation';

// Pre-composed validate() + schema middlewares, matching the
// deposit.middleware.ts convention. Explicit RequestHandler annotations avoid
// TS2742.
export const validateStockListQuery: RequestHandler = validate({ query: stockListQuerySchema });
export const validateStockIdParam: RequestHandler = validate({ params: mongoIdParamSchema });
export const validateStockHistoryQuery: RequestHandler = validate({
  params: mongoIdParamSchema,
  query: stockHistoryQuerySchema,
});
