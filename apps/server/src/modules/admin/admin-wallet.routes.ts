import { Router } from 'express';
import { UserRole } from 'shared-types';

import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';

import { adminWalletController } from './admin-wallet.controller';
import {
  validateAdminWalletListQuery,
  validateWalletAdjustment,
  validateWalletIdParam,
  validateWalletUserIdParam,
} from './admin-wallet.middleware';

export const adminWalletRouter: Router = Router();

// Every route below requires an authenticated ADMIN or SUPER_ADMIN.
adminWalletRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

adminWalletRouter.get('/', validateAdminWalletListQuery, adminWalletController.listWallets);
adminWalletRouter.get(
  '/user/:userId',
  validateWalletUserIdParam,
  adminWalletController.getWalletByUserId,
);
adminWalletRouter.get('/:id', validateWalletIdParam, adminWalletController.getWalletById);
adminWalletRouter.post('/:id/adjust', validateWalletAdjustment, adminWalletController.adjustWallet);
