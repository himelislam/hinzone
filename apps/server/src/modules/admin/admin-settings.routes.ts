import { Router } from 'express';
import { UserRole } from 'shared-types';

import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';

import { adminSettingsController } from './admin-settings.controller';
import {
  validateUpdateCurrency,
  validateUpdateDeposit,
  validateUpdateGeneral,
  validateUpdateHomepage,
  validateUpdateMlm,
  validateUpdateNotification,
  validateUpdateSecurity,
  validateUpdateStock,
  validateUpdateTrading,
  validateUpdateWithdrawal,
} from './admin-settings.middleware';

export const adminSettingsRouter: Router = Router();

// Every route below requires an authenticated ADMIN or SUPER_ADMIN
// (docs/20-settings-system.md #21, #28).
adminSettingsRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

adminSettingsRouter.put('/general', validateUpdateGeneral, adminSettingsController.updateGeneral);
adminSettingsRouter.put(
  '/currency',
  validateUpdateCurrency,
  adminSettingsController.updateCurrency,
);
adminSettingsRouter.put('/deposit', validateUpdateDeposit, adminSettingsController.updateDeposit);
adminSettingsRouter.put(
  '/withdrawal',
  validateUpdateWithdrawal,
  adminSettingsController.updateWithdrawal,
);
adminSettingsRouter.put('/trading', validateUpdateTrading, adminSettingsController.updateTrading);
adminSettingsRouter.put('/stocks', validateUpdateStock, adminSettingsController.updateStock);
adminSettingsRouter.put('/mlm', validateUpdateMlm, adminSettingsController.updateMLM);
adminSettingsRouter.put(
  '/notifications',
  validateUpdateNotification,
  adminSettingsController.updateNotification,
);
adminSettingsRouter.put(
  '/security',
  validateUpdateSecurity,
  adminSettingsController.updateSecurity,
);
adminSettingsRouter.put(
  '/homepage',
  validateUpdateHomepage,
  adminSettingsController.updateHomepage,
);
