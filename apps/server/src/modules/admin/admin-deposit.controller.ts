import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { buildAuditContext } from '../audit-log/audit-log.helpers';
import { toDepositListArgs, toDepositResponse } from '../deposit/deposit.dto';
import { depositService } from '../deposit/deposit.service';
import type { DepositListQuery, RejectDepositRequestBody } from '../deposit/deposit.validation';

const listDeposits = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as DepositListQuery;

  const result = await depositService.listForAdmin(...toDepositListArgs(query));

  paginationResponse(
    res,
    result.items.map(toDepositResponse),
    query.page,
    query.limit,
    result.total,
  );
};

const getDepositById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const deposit = await depositService.getByIdForAdmin(id);

  successResponse(res, toDepositResponse(deposit), 'Deposit retrieved successfully.');
};

// tasks/phase-05.md's Deposit Approval Workflow - the admin note field is not
// yet exposed on this endpoint's body (no Zod schema covers it, only
// rejectionReason does for the reject endpoint), so it is passed through as
// undefined for now rather than reading unvalidated req.body input.
const approveDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);

  const result = await depositService.approveDeposit(
    id,
    adminId,
    undefined,
    buildAuditContext(req),
  );

  successResponse(res, toDepositResponse(result.deposit), 'Deposit approved successfully.');
};

const rejectDeposit = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const { rejectionReason } = req.body as RejectDepositRequestBody;

  const deposit = await depositService.rejectDeposit(
    id,
    adminId,
    rejectionReason,
    buildAuditContext(req),
  );

  successResponse(res, toDepositResponse(deposit), 'Deposit rejected successfully.');
};

export const adminDepositController = {
  listDeposits,
  getDepositById,
  approveDeposit,
  rejectDeposit,
};
