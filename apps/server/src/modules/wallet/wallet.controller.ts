import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { toTransactionResponse, toWalletResponse } from './wallet.dto';
import { walletService } from './wallet.service';
import type { TransactionQuery } from './wallet.validation';

// Every handler below resolves the caller's own wallet via getAuthenticatedUserId
// first - none of these routes ever take a walletId from the request, so a user
// can only ever see their own wallet/transactions (tasks/phase-04.md - "Only
// authenticated users can access their wallets").

const getWallet = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const wallet = await walletService.getWalletByUser(userId);

  successResponse(res, toWalletResponse(wallet), 'Wallet retrieved successfully.');
};

const getSummary = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const wallet = await walletService.getWalletByUser(userId);
  const summary = await walletService.getWalletSummary(wallet.id);

  successResponse(res, summary, 'Wallet summary retrieved successfully.');
};

const getTransactions = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const {
    page,
    limit,
    sortBy,
    type,
    category,
    status,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    search,
  } = req.query as unknown as TransactionQuery;

  const wallet = await walletService.getWalletByUser(userId);
  const result = await walletService.getTransactionHistory(
    wallet.id,
    { page, limit, sortBy },
    { type, category, status, dateFrom, dateTo, minAmount, maxAmount, search },
  );

  paginationResponse(res, result.items.map(toTransactionResponse), page, limit, result.total);
};

const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params as unknown as MongoIdParams;

  const wallet = await walletService.getWalletByUser(userId);
  const transaction = await walletService.getTransaction(wallet.id, id);

  successResponse(res, toTransactionResponse(transaction), 'Transaction retrieved successfully.');
};

export const walletController = {
  getWallet,
  getSummary,
  getTransactions,
  getTransactionById,
};
