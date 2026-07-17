import type { Request, Response } from 'express';

import { ValidationError } from '@/shared/errors';
import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { toDepositListArgs, toDepositResponse } from './deposit.dto';
import { depositService } from './deposit.service';
import type { CreateDepositRequestBody, DepositListQuery } from './deposit.validation';

// Every handler below resolves the caller's own deposits via
// getAuthenticatedUserId - none of these routes ever take a userId from the
// request, so a user can only ever see/act on their own deposits
// (tasks/phase-05.md - "Every request must validate ownership and permissions").

const createDeposit = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const body = req.body as CreateDepositRequestBody;

  if (!req.file) {
    throw new ValidationError('A payment screenshot is required.', [
      { path: 'screenshot', message: 'A payment screenshot is required.' },
    ]);
  }

  const deposit = await depositService.createDeposit(userId, body, {
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
  });

  successResponse(res, toDepositResponse(deposit), 'Deposit request submitted successfully.', 201);
};

const getDeposits = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const query = req.query as unknown as DepositListQuery;

  const result = await depositService.listForUser(userId, ...toDepositListArgs(query));

  paginationResponse(
    res,
    result.items.map(toDepositResponse),
    query.page,
    query.limit,
    result.total,
  );
};

const getDepositById = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params as unknown as MongoIdParams;

  const deposit = await depositService.getByIdForUser(userId, id);

  successResponse(res, toDepositResponse(deposit), 'Deposit retrieved successfully.');
};

const cancelDeposit = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params as unknown as MongoIdParams;

  const deposit = await depositService.cancelDeposit(userId, id);

  successResponse(res, toDepositResponse(deposit), 'Deposit cancelled successfully.');
};

export const depositController = {
  createDeposit,
  getDeposits,
  getDepositById,
  cancelDeposit,
};
