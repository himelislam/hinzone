import type { Request, Response } from 'express';

import { ValidationError } from '@/shared/errors';
import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { successResponse } from '@/shared/response';

import { toUserResponse } from './users.dto';
import { userService } from './users.service';
import type { UpdateProfileRequestBody } from './users.validation';

const getProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const user = await userService.getUserById(userId);

  successResponse(res, toUserResponse(user), 'Profile retrieved successfully.');
};

const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const body = req.body as UpdateProfileRequestBody;
  const user = await userService.updateProfile(userId, body);

  successResponse(res, toUserResponse(user), 'Profile updated successfully.');
};

const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);

  if (!req.file) {
    throw new ValidationError('An image file is required.', [
      { path: 'image', message: 'An image file is required.' },
    ]);
  }

  const user = await userService.updateProfileImage(userId, {
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
  });

  successResponse(res, toUserResponse(user), 'Profile image updated successfully.');
};

export const usersController = {
  getProfile,
  updateProfile,
  uploadProfileImage,
};
