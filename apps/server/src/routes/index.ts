import { Router, type Router as RouterType } from 'express';

import { adminSettingsRouter } from '@/modules/admin/admin-settings.routes';
import { adminUsersRouter } from '@/modules/admin/admin-users.routes';
import { adminWalletRouter } from '@/modules/admin/admin-wallet.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { settingsRouter } from '@/modules/settings/settings.routes';
import { usersRouter } from '@/modules/users/users.routes';
import { walletRouter } from '@/modules/wallet/wallet.routes';

export const apiRouter: RouterType = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/admin/users', adminUsersRouter);
apiRouter.use('/admin/settings', adminSettingsRouter);
apiRouter.use('/admin/wallets', adminWalletRouter);
