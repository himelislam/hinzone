import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import type { AuditContext } from '../audit-log/audit-log.types';
import { toUserResponse } from '../users/users.dto';
import type {
  AdminUpdateUserRequestBody,
  ListUsersQuery,
  UpdateUserStatusRequestBody,
} from '../users/users.validation';

import { adminUsersService } from './admin-users.service';

// Matches auth.controller.ts's buildRequestContext, narrowed to what an admin
// audit entry needs - these routes never create a session, so no
// device/browser/operatingSystem fields to capture.
const buildAuditContext = (req: Request): AuditContext => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
});

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
