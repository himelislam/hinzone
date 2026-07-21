import { Router } from 'express';
import { UserRole } from 'shared-types';

import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';
import { uploadStockLogo } from '@/middlewares/upload';

import { adminStockController } from './admin-stock.controller';
import {
  validateAdminStockListQuery,
  validateChangeStockStatus,
  validateCreateStock,
  validateStockIdParam,
  validateUpdateStock,
  validateUpdateStockPrice,
} from './admin-stock.middleware';

export const adminStockRouter: Router = Router();

// Every route below requires an authenticated ADMIN or SUPER_ADMIN.
adminStockRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

// uploadStockLogo must run before validateCreateStock/validateUpdateStock -
// multer parses the multipart body into req.body/req.file, so a Zod body
// schema running first would see an empty req.body (same ordering constraint
// as deposit.routes.ts's uploadDepositScreenshot).
adminStockRouter.post('/', uploadStockLogo, validateCreateStock, adminStockController.createStock);
adminStockRouter.get('/', validateAdminStockListQuery, adminStockController.listStocks);
adminStockRouter.get('/:id', validateStockIdParam, adminStockController.getStockById);
adminStockRouter.put(
  '/:id',
  uploadStockLogo,
  validateUpdateStock,
  adminStockController.updateStock,
);
adminStockRouter.patch('/:id/status', validateChangeStockStatus, adminStockController.changeStatus);
adminStockRouter.patch('/:id/price', validateUpdateStockPrice, adminStockController.updatePrice);
adminStockRouter.delete('/:id', validateStockIdParam, adminStockController.deleteStock);
