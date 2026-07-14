import { Router, type Router as RouterType } from 'express';

import { adminUsersRouter } from '@/modules/admin/admin-users.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { usersRouter } from '@/modules/users/users.routes';

export const apiRouter: RouterType = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/admin/users', adminUsersRouter);
