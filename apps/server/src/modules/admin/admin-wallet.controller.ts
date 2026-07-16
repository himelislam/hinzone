import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { buildAuditContext } from '../audit-log/audit-log.helpers';
import { toTransactionResponse, toWalletResponse } from '../wallet/wallet.dto';
import { walletAdminService } from '../wallet/wallet-admin.service';
import type {
  AdminWalletListQuery,
  WalletAdjustmentRequestBody,
  WalletUserIdParams,
} from '../wallet/wallet.validation';

const listWallets = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, sort, order, status } = req.query as unknown as AdminWalletListQuery;

  const result = await walletAdminService.listWallets({ page, limit, sort, order }, { status });

  paginationResponse(res, result.items.map(toWalletResponse), page, limit, result.total);
};

const getWalletById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const wallet = await walletAdminService.getWalletById(id);

  successResponse(res, toWalletResponse(wallet), 'Wallet retrieved successfully.');
};

const getWalletByUserId = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params as unknown as WalletUserIdParams;
  const wallet = await walletAdminService.getWalletByUserId(userId);

  successResponse(res, toWalletResponse(wallet), 'Wallet retrieved successfully.');
};

const adjustWallet = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const body = req.body as WalletAdjustmentRequestBody;

  const result = await walletAdminService.adjustWallet(id, body, adminId, buildAuditContext(req));

  successResponse(
    res,
    {
      wallet: toWalletResponse(result.wallet),
      transaction: toTransactionResponse(result.transaction),
    },
    'Wallet adjusted successfully.',
  );
};

export const adminWalletController = {
  listWallets,
  getWalletById,
  getWalletByUserId,
  adjustWallet,
};
