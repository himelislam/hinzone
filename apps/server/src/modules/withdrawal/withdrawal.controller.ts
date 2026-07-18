import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { toWithdrawalListArgs, toWithdrawalResponse } from './withdrawal.dto';
import { withdrawalService } from './withdrawal.service';
import type { CreateWithdrawalRequestBody, WithdrawalListQuery } from './withdrawal.validation';

// Every handler below resolves the caller's own withdrawals via
// getAuthenticatedUserId - none of these routes ever take a userId from the
// request, so a user can only ever see/act on their own withdrawals
// (tasks/phase-06.md - "Every request must validate ownership and permissions").
// Unlike deposit.controller.ts's createDeposit, this body carries no file
// (no multer step), so it's already fully validated by createWithdrawalSchema
// before this handler runs.

const createWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const body = req.body as CreateWithdrawalRequestBody;

  const withdrawal = await withdrawalService.createWithdrawal(userId, body);

  successResponse(
    res,
    toWithdrawalResponse(withdrawal),
    'Withdrawal request submitted successfully.',
    201,
  );
};

const getWithdrawals = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const query = req.query as unknown as WithdrawalListQuery;

  const result = await withdrawalService.listForUser(userId, ...toWithdrawalListArgs(query));

  paginationResponse(
    res,
    result.items.map((withdrawal) => toWithdrawalResponse(withdrawal)),
    query.page,
    query.limit,
    result.total,
  );
};

const getWithdrawalById = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params as unknown as MongoIdParams;

  const withdrawal = await withdrawalService.getByIdForUser(userId, id);

  successResponse(res, toWithdrawalResponse(withdrawal), 'Withdrawal retrieved successfully.');
};

const cancelWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params as unknown as MongoIdParams;

  const withdrawal = await withdrawalService.cancelWithdrawal(userId, id);

  successResponse(res, toWithdrawalResponse(withdrawal), 'Withdrawal cancelled successfully.');
};

export const withdrawalController = {
  createWithdrawal,
  getWithdrawals,
  getWithdrawalById,
  cancelWithdrawal,
};
