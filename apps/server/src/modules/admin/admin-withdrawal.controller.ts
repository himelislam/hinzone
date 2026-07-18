import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { buildAuditContext } from '../audit-log/audit-log.helpers';
import { toWithdrawalListArgs, toWithdrawalResponse } from '../withdrawal/withdrawal.dto';
import { withdrawalService } from '../withdrawal/withdrawal.service';
import type {
  RejectWithdrawalRequestBody,
  WithdrawalListQuery,
} from '../withdrawal/withdrawal.validation';

const listWithdrawals = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as WithdrawalListQuery;

  const result = await withdrawalService.listForAdmin(...toWithdrawalListArgs(query));

  paginationResponse(
    res,
    result.items.map((withdrawal) => toWithdrawalResponse(withdrawal)),
    query.page,
    query.limit,
    result.total,
  );
};

const getWithdrawalById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const withdrawal = await withdrawalService.getByIdForAdmin(id);
  const waitingPeriodSatisfied = await withdrawalService.getWaitingPeriodStatusForAdmin(withdrawal);

  successResponse(
    res,
    toWithdrawalResponse(withdrawal, waitingPeriodSatisfied),
    'Withdrawal retrieved successfully.',
  );
};

// tasks/phase-06.md's Withdrawal Approval Workflow - the admin note field is
// not yet exposed on this endpoint's body (no Zod schema covers it, only
// rejectionReason does for the reject endpoint), so it is passed through as
// undefined for now rather than reading unvalidated req.body input - same
// precedent as admin-deposit.controller.ts's approveDeposit.
const approveWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);

  const withdrawal = await withdrawalService.approveWithdrawal(
    id,
    adminId,
    undefined,
    buildAuditContext(req),
  );

  successResponse(res, toWithdrawalResponse(withdrawal), 'Withdrawal approved successfully.');
};

const rejectWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const { rejectionReason } = req.body as RejectWithdrawalRequestBody;

  const withdrawal = await withdrawalService.rejectWithdrawal(
    id,
    adminId,
    rejectionReason,
    buildAuditContext(req),
  );

  successResponse(res, toWithdrawalResponse(withdrawal), 'Withdrawal rejected successfully.');
};

const markProcessing = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);

  const withdrawal = await withdrawalService.markProcessing(id, adminId, buildAuditContext(req));

  successResponse(res, toWithdrawalResponse(withdrawal), 'Withdrawal moved to processing.');
};

const completeWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);

  const result = await withdrawalService.completeWithdrawal(id, adminId, buildAuditContext(req));

  successResponse(
    res,
    toWithdrawalResponse(result.withdrawal),
    'Withdrawal completed successfully.',
  );
};

export const adminWithdrawalController = {
  listWithdrawals,
  getWithdrawalById,
  approveWithdrawal,
  rejectWithdrawal,
  markProcessing,
  completeWithdrawal,
};
