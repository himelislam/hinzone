import { Router, type Router as RouterType } from 'express';

import { adminSettingsRouter } from '@/modules/admin/admin-settings.routes';
import { adminUsersRouter } from '@/modules/admin/admin-users.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { settingsRouter } from '@/modules/settings/settings.routes';
import { usersRouter } from '@/modules/users/users.routes';

export const apiRouter: RouterType = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/admin/users', adminUsersRouter);
apiRouter.use('/admin/settings', adminSettingsRouter);
