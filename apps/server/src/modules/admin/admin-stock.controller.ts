import type { Request, Response } from 'express';

import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { buildAuditContext } from '../audit-log/audit-log.helpers';
import { stockAdminService } from '../stock/stock-admin.service';
import { toAdminStockListArgs, toStockResponse } from '../stock/stock.dto';
import { stockLifecycleService } from '../stock/stock-lifecycle.service';
import type {
  AdminStockListQuery,
  ChangeStockStatusRequestBody,
  CreateStockRequestBody,
  UpdateStockPriceRequestBody,
  UpdateStockRequestBody,
} from '../stock/stock.validation';

const createStock = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const body = req.body as CreateStockRequestBody;

  const stock = await stockAdminService.createStock(
    adminId,
    body,
    req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined,
    buildAuditContext(req),
  );

  successResponse(res, toStockResponse(stock), 'Stock created successfully.', 201);
};

const listStocks = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as AdminStockListQuery;

  const result = await stockAdminService.listForAdmin(...toAdminStockListArgs(query));

  paginationResponse(res, result.items.map(toStockResponse), query.page, query.limit, result.total);
};

const getStockById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;

  const stock = await stockAdminService.getByIdForAdmin(id);

  successResponse(res, toStockResponse(stock), 'Stock retrieved successfully.');
};

const updateStock = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const body = req.body as UpdateStockRequestBody;

  const stock = await stockAdminService.updateStock(
    id,
    adminId,
    body,
    req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined,
    buildAuditContext(req),
  );

  successResponse(res, toStockResponse(stock), 'Stock updated successfully.');
};

// phase-07.md's API Endpoints list has one status route for every target
// status (including ARCHIVED) - stockLifecycleService.changeStatus itself
// picks the right audit action (STOCK_ARCHIVED vs. the generic
// STOCK_STATUS_CHANGED), so this handler doesn't need to know the difference.
const changeStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const { status } = req.body as ChangeStockStatusRequestBody;

  const stock = await stockLifecycleService.changeStatus(
    id,
    status,
    adminId,
    buildAuditContext(req),
  );

  successResponse(res, toStockResponse(stock), 'Stock status updated successfully.');
};

const updatePrice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);
  const { newPrice } = req.body as UpdateStockPriceRequestBody;

  const result = await stockLifecycleService.updatePrice(
    id,
    newPrice,
    adminId,
    buildAuditContext(req),
  );

  successResponse(res, toStockResponse(result.stock), 'Stock price updated successfully.');
};

const deleteStock = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const adminId = getAuthenticatedUserId(req);

  const stock = await stockLifecycleService.deleteStock(id, adminId, buildAuditContext(req));

  successResponse(res, toStockResponse(stock), 'Stock deleted successfully.');
};

export const adminStockController = {
  createStock,
  listStocks,
  getStockById,
  updateStock,
  changeStatus,
  updatePrice,
  deleteStock,
};
