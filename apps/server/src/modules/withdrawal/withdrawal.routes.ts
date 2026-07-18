import { Router } from 'express';

import { authenticate } from '@/middlewares/authenticate';

import { withdrawalController } from './withdrawal.controller';
import {
  validateCreateWithdrawal,
  validateWithdrawalIdParam,
  validateWithdrawalListQuery,
} from './withdrawal.middleware';

export const withdrawalRouter: Router = Router();

// Every route below requires an authenticated user.
withdrawalRouter.use(authenticate);

withdrawalRouter.post('/', validateCreateWithdrawal, withdrawalController.createWithdrawal);
withdrawalRouter.get('/', validateWithdrawalListQuery, withdrawalController.getWithdrawals);
withdrawalRouter.get('/:id', validateWithdrawalIdParam, withdrawalController.getWithdrawalById);
withdrawalRouter.delete('/:id', validateWithdrawalIdParam, withdrawalController.cancelWithdrawal);
