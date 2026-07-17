import { Router } from 'express';

import { authenticate } from '@/middlewares/authenticate';
import { uploadDepositScreenshot } from '@/middlewares/upload';

import { depositController } from './deposit.controller';
import {
  validateCreateDeposit,
  validateDepositIdParam,
  validateDepositListQuery,
} from './deposit.middleware';

export const depositRouter: Router = Router();

// Every route below requires an authenticated user.
depositRouter.use(authenticate);

// uploadDepositScreenshot must run before validateCreateDeposit - multer parses
// the multipart body into req.body/req.file, so a Zod body schema running first
// would see an empty req.body.
depositRouter.post(
  '/',
  uploadDepositScreenshot,
  validateCreateDeposit,
  depositController.createDeposit,
);
depositRouter.get('/', validateDepositListQuery, depositController.getDeposits);
depositRouter.get('/:id', validateDepositIdParam, depositController.getDepositById);
depositRouter.delete('/:id', validateDepositIdParam, depositController.cancelDeposit);
