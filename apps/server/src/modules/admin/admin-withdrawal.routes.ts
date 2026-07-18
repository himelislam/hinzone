import { Router } from 'express';
import { UserRole } from 'shared-types';

import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';

import { adminWithdrawalController } from './admin-withdrawal.controller';
import {
  validateAdminWithdrawalListQuery,
  validateRejectWithdrawal,
  validateWithdrawalIdParam,
} from './admin-withdrawal.middleware';

export const adminWithdrawalRouter: Router = Router();

// Every route below requires an authenticated ADMIN or SUPER_ADMIN.
adminWithdrawalRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

adminWithdrawalRouter.get(
  '/',
  validateAdminWithdrawalListQuery,
  adminWithdrawalController.listWithdrawals,
);
adminWithdrawalRouter.get(
  '/:id',
  validateWithdrawalIdParam,
  adminWithdrawalController.getWithdrawalById,
);
adminWithdrawalRouter.patch(
  '/:id/approve',
  validateWithdrawalIdParam,
  adminWithdrawalController.approveWithdrawal,
);
adminWithdrawalRouter.patch(
  '/:id/reject',
  validateRejectWithdrawal,
  adminWithdrawalController.rejectWithdrawal,
);
adminWithdrawalRouter.patch(
  '/:id/processing',
  validateWithdrawalIdParam,
  adminWithdrawalController.markProcessing,
);
adminWithdrawalRouter.patch(
  '/:id/complete',
  validateWithdrawalIdParam,
  adminWithdrawalController.completeWithdrawal,
);
