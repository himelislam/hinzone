import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { buildAuditContext } from '../audit-log/audit-log.helpers';
import { toUserResponse } from '../users/users.dto';
import type {
  AdminUpdateUserRequestBody,
  ListUsersQuery,
  UpdateUserStatusRequestBody,
} from '../users/users.validation';

import { adminUsersService } from './admin-users.service';

const listUsers = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order, search, role, status, dateFrom, dateTo } =
    req.query as unknown as ListUsersQuery;

  const result = await adminUsersService.listUsers(
    { page, limit, sort, order },
    { search, role, status, dateFrom, dateTo },
  );

  paginationResponse(res, result.items.map(toUserResponse), page, limit, result.total);
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const user = await adminUsersService.getUserById(id);

  successResponse(res, toUserResponse(user), 'User retrieved successfully.');
};

const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const body = req.body as AdminUpdateUserRequestBody;

  const user = await adminUsersService.updateUser(id, body, adminId, buildAuditContext(req));

  successResponse(res, toUserResponse(user), 'User updated successfully.');
};

const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const { status } = req.body as UpdateUserStatusRequestBody;

  const user = await adminUsersService.updateUserStatus(
    id,
    status,
    adminId,
    buildAuditContext(req),
  );

  successResponse(res, toUserResponse(user), 'User status updated successfully.');
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);

  const user = await adminUsersService.deleteUser(id, adminId, buildAuditContext(req));

  successResponse(res, toUserResponse(user), 'User deleted successfully.');
};

const triggerPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  await adminUsersService.triggerPasswordReset(id);

  successResponse(res, null, 'Password reset initiated for this user.');
};

export const adminUsersController = {
  listUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  triggerPasswordReset,
};
