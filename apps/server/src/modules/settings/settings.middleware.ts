import type { RequestHandler } from 'express';

import { validate } from '@/middlewares/validate';

import { settingsCategoryParamSchema } from './settings.validation';

// Pre-composed validate() + schema middleware, matching the auth.middleware.ts /
// users.middleware.ts convention.
export const validateSettingsCategoryParam: RequestHandler = validate({
  params: settingsCategoryParamSchema,
});
