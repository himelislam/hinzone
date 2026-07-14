import { Router } from 'express';

import { authenticate } from '@/middlewares/authenticate';
import { uploadAvatar } from '@/middlewares/upload';

import { usersController } from './users.controller';
import { validateUpdateProfile } from './users.middleware';

export const usersRouter: Router = Router();

usersRouter.get('/profile', authenticate, usersController.getProfile);
usersRouter.put('/profile', authenticate, validateUpdateProfile, usersController.updateProfile);
usersRouter.post('/profile/image', authenticate, uploadAvatar, usersController.uploadProfileImage);
