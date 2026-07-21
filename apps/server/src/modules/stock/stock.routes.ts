import { Router } from 'express';

import { stockController } from './stock.controller';
import {
  validateStockHistoryQuery,
  validateStockIdParam,
  validateStockListQuery,
} from './stock.middleware';

export const stockRouter: Router = Router();

// All public, unauthenticated - phase-07.md's Security section: "Public
// users may only view active stocks," not "must be logged in to view
// stocks." /featured and /categories must be registered before /:id so
// Express doesn't treat either literal segment as an :id value.
stockRouter.get('/', validateStockListQuery, stockController.getStocks);
stockRouter.get('/featured', stockController.getFeaturedStocks);
stockRouter.get('/categories', stockController.getCategories);
stockRouter.get('/:id', validateStockIdParam, stockController.getStock);
stockRouter.get('/:id/history', validateStockHistoryQuery, stockController.getPriceHistory);
