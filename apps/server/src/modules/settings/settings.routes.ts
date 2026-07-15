import { Router } from 'express';

import { settingsController } from './settings.controller';
import { validateSettingsCategoryParam } from './settings.middleware';

// Public reads only (docs/20-settings-system.md #21) - admin writes live in
// modules/admin/admin-settings.routes.ts, mounted separately under /admin/settings
// with authenticate + authorize(ADMIN, SUPER_ADMIN), matching the
// users.routes.ts / admin-users.routes.ts split.
export const settingsRouter: Router = Router();

settingsRouter.get('/', settingsController.getAllSettings);
settingsRouter.get(
  '/:category',
  validateSettingsCategoryParam,
  settingsController.getSettingsByCategory,
);
