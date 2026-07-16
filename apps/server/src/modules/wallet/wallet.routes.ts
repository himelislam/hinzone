import { Router } from 'express';

import { authenticate } from '@/middlewares/authenticate';

import { walletController } from './wallet.controller';
import { validateTransactionIdParam, validateTransactionQuery } from './wallet.middleware';

export const walletRouter: Router = Router();

// Every route below requires an authenticated user.
walletRouter.use(authenticate);

walletRouter.get('/', walletController.getWallet);
walletRouter.get('/summary', walletController.getSummary);
walletRouter.get('/transactions', validateTransactionQuery, walletController.getTransactions);
walletRouter.get(
  '/transactions/:id',
  validateTransactionIdParam,
  walletController.getTransactionById,
);
