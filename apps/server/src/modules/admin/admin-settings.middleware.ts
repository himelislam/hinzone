import type { RequestHandler } from 'express';
import { SettingsCategory } from 'shared-types';

import { validate } from '@/middlewares/validate';
import { SETTINGS_VALIDATION_SCHEMAS } from '@/modules/settings/settings.validation';

// Pre-composed validate() + schema middlewares, one per literal PUT
// /admin/settings/<category> route, matching admin-users.middleware.ts's
// convention. Each pulls its schema from the same category-keyed map
// settings.middleware.ts's generic param validator is built from.
export const validateUpdateGeneral: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.GENERAL],
});
export const validateUpdateCurrency: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.CURRENCY],
});
export const validateUpdateDeposit: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.DEPOSIT],
});
export const validateUpdateWithdrawal: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.WITHDRAWAL],
});
export const validateUpdateTrading: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.TRADING],
});
export const validateUpdateStock: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.STOCKS],
});
export const validateUpdateMlm: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.MLM],
});
export const validateUpdateHomepage: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.HOMEPAGE],
});
export const validateUpdateNotification: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.NOTIFICATIONS],
});
export const validateUpdateSecurity: RequestHandler = validate({
  body: SETTINGS_VALIDATION_SCHEMAS[SettingsCategory.SECURITY],
});
