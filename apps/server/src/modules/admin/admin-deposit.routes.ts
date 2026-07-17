import { Router } from 'express';
import { UserRole } from 'shared-types';

import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';

import { adminDepositController } from './admin-deposit.controller';
import {
  validateAdminDepositListQuery,
  validateDepositIdParam,
  validateRejectDeposit,
} from './admin-deposit.middleware';

export const adminDepositRouter: Router = Router();

// Every route below requires an authenticated ADMIN or SUPER_ADMIN.
adminDepositRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

adminDepositRouter.get('/', validateAdminDepositListQuery, adminDepositController.listDeposits);
adminDepositRouter.get('/:id', validateDepositIdParam, adminDepositController.getDepositById);
adminDepositRouter.patch(
  '/:id/approve',
  validateDepositIdParam,
  adminDepositController.approveDeposit,
);
adminDepositRouter.patch(
  '/:id/reject',
  validateRejectDeposit,
  adminDepositController.rejectDeposit,
);
