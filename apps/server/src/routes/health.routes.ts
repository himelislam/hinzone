import { Router } from 'express';

import { isDatabaseConnected } from '@/database/connection';
import { errorResponse, successResponse } from '@/shared/response';

export const healthRouter: Router = Router();

healthRouter.get('/health', (_req, res) => {
  const databaseConnected = isDatabaseConnected();

  if (!databaseConnected) {
    errorResponse(res, 'Service unavailable.', 503, 'DATABASE_DISCONNECTED');
    return;
  }

  successResponse(res, {
    status: 'ok',
    database: 'connected',
  });
});
