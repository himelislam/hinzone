import { Router, type Router as RouterType } from 'express';

import { adminDepositRouter } from '@/modules/admin/admin-deposit.routes';
import { adminSettingsRouter } from '@/modules/admin/admin-settings.routes';
import { adminStockRouter } from '@/modules/admin/admin-stock.routes';
import { adminUsersRouter } from '@/modules/admin/admin-users.routes';
import { adminWalletRouter } from '@/modules/admin/admin-wallet.routes';
import { adminWithdrawalRouter } from '@/modules/admin/admin-withdrawal.routes';
import { authRouter } from '@/modules/auth/auth.routes';
import { depositRouter } from '@/modules/deposit/deposit.routes';
import { settingsRouter } from '@/modules/settings/settings.routes';
import { stockRouter } from '@/modules/stock/stock.routes';
import { usersRouter } from '@/modules/users/users.routes';
import { walletRouter } from '@/modules/wallet/wallet.routes';
import { withdrawalRouter } from '@/modules/withdrawal/withdrawal.routes';

export const apiRouter: RouterType = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/deposits', depositRouter);
apiRouter.use('/withdrawals', withdrawalRouter);
apiRouter.use('/stocks', stockRouter);
apiRouter.use('/admin/users', adminUsersRouter);
apiRouter.use('/admin/settings', adminSettingsRouter);
apiRouter.use('/admin/wallets', adminWalletRouter);
apiRouter.use('/admin/deposits', adminDepositRouter);
apiRouter.use('/admin/withdrawals', adminWithdrawalRouter);
apiRouter.use('/admin/stocks', adminStockRouter);
