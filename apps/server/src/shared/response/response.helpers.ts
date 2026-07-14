import type { Response } from 'express';

import type { ErrorDetail } from '@/shared/errors';

export interface PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;
}

export const successResponse = <T>(
  res: Response,
  data: T,
  message = 'Operation completed successfully.',
  statusCode = 200,
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number,
  errorCode: string,
  errors?: ReadonlyArray<ErrorDetail>,
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    errors,
  });
};

export const paginationResponse = <T>(
  res: Response,
  data: ReadonlyArray<T>,
  page: number,
  limit: number,
  total: number,
): Response => {
  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
  };

  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
};
