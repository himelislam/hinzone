import { Router } from 'express';
import { UserRole } from 'shared-types';

import { authenticate } from '@/middlewares/authenticate';
import { authorize } from '@/middlewares/authorize';

import { adminUsersController } from './admin-users.controller';
import {
  validateAdminUpdateUser,
  validateListUsersQuery,
  validateUpdateUserStatus,
  validateUserIdParam,
} from './admin-users.middleware';

export const adminUsersRouter: Router = Router();

// Every route below requires an authenticated ADMIN or SUPER_ADMIN.
adminUsersRouter.use(authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN));

adminUsersRouter.get('/', validateListUsersQuery, adminUsersController.listUsers);
adminUsersRouter.get('/:id', validateUserIdParam, adminUsersController.getUserById);
adminUsersRouter.put('/:id', validateAdminUpdateUser, adminUsersController.updateUser);
adminUsersRouter.patch(
  '/:id/status',
  validateUpdateUserStatus,
  adminUsersController.updateUserStatus,
);
adminUsersRouter.delete('/:id', validateUserIdParam, adminUsersController.deleteUser);
adminUsersRouter.post(
  '/:id/reset-password',
  validateUserIdParam,
  adminUsersController.triggerPasswordReset,
);
