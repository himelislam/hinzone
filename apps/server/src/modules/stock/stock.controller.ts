import type { Request, Response } from 'express';

import { paginationResponse, successResponse } from '@/shared/response';
import type { MongoIdParams } from '@/shared/validators/mongo-id.validator';

import { toMarketHistoryResponse, toStockListArgs, toStockResponse } from './stock.dto';
import { stockService } from './stock.service';
import type { StockHistoryQuery, StockListQuery } from './stock.validation';

const getStocks = async (req: Request, res: Response): Promise<void> => {
  const query = req.query as unknown as StockListQuery;

  const result = await stockService.getStocks(...toStockListArgs(query));

  paginationResponse(res, result.items.map(toStockResponse), query.page, query.limit, result.total);
};

const getFeaturedStocks = async (_req: Request, res: Response): Promise<void> => {
  const stocks = await stockService.getFeaturedStocks();

  successResponse(res, stocks.map(toStockResponse), 'Featured stocks retrieved successfully.');
};

const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await stockService.getCategories();

  successResponse(res, categories, 'Categories retrieved successfully.');
};

const getStock = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;

  const stock = await stockService.getStock(id);

  successResponse(res, toStockResponse(stock), 'Stock retrieved successfully.');
};

const getPriceHistory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as unknown as MongoIdParams;
  const query = req.query as unknown as StockHistoryQuery;

  // Confirms the stock is public before exposing its history - a nonexistent
  // or hidden stock's history 404s the same way the stock itself does
  // (tasks/breakdown/phase-07-tasks.md task 22's note: visibility is checked
  // by the caller, not inside StockService.getPriceHistory itself).
  await stockService.getStock(id);

  const result = await stockService.getPriceHistory(id, {
    page: query.page,
    limit: query.limit,
  });

  paginationResponse(
    res,
    result.items.map(toMarketHistoryResponse),
    query.page,
    query.limit,
    result.total,
  );
};

export const stockController = {
  getStocks,
  getFeaturedStocks,
  getCategories,
  getStock,
  getPriceHistory,
};
