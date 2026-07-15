import type { Request, Response } from 'express';
import type {
  CurrencySettings,
  DepositSettings,
  GeneralSettings,
  HomepageSettings,
  MlmSettings,
  NotificationSettings,
  SecuritySettings,
  StockSettings,
  TradingSettings,
  WithdrawalSettings,
} from 'shared-types';

import { settingsService } from '@/modules/settings/settings.service';
import { getAuthenticatedUserId } from '@/shared/helpers/get-authenticated-user-id';
import { successResponse } from '@/shared/response';

import { buildAuditContext } from '../audit-log/audit-log.helpers';

// Admin writes only (docs/20-settings-system.md #21, #28) - each handler maps 1:1
// to one of the 10 literal PUT /admin/settings/<category> routes and one of
// settingsService's literal updateX() methods, which creates the audit log entry
// (docs/20 #27) once the write succeeds.
const updateGeneral = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as GeneralSettings;
  const updated = await settingsService.updateGeneral(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'General settings updated successfully.');
};

const updateCurrency = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as CurrencySettings;
  const updated = await settingsService.updateCurrency(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Currency settings updated successfully.');
};

const updateDeposit = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as DepositSettings;
  const updated = await settingsService.updateDeposit(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Deposit settings updated successfully.');
};

const updateWithdrawal = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as WithdrawalSettings;
  const updated = await settingsService.updateWithdrawal(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Withdrawal settings updated successfully.');
};

const updateTrading = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as TradingSettings;
  const updated = await settingsService.updateTrading(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Trading settings updated successfully.');
};

const updateStock = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as StockSettings;
  const updated = await settingsService.updateStock(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Stock settings updated successfully.');
};

const updateMLM = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as MlmSettings;
  const updated = await settingsService.updateMLM(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'MLM settings updated successfully.');
};

const updateHomepage = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as HomepageSettings;
  const updated = await settingsService.updateHomepage(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Homepage settings updated successfully.');
};

const updateNotification = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as NotificationSettings;
  const updated = await settingsService.updateNotification(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Notification settings updated successfully.');
};

const updateSecurity = async (req: Request, res: Response): Promise<void> => {
  const adminId = getAuthenticatedUserId(req);
  const data = req.body as SecuritySettings;
  const updated = await settingsService.updateSecurity(data, adminId, buildAuditContext(req));

  successResponse(res, updated, 'Security settings updated successfully.');
};

export const adminSettingsController = {
  updateGeneral,
  updateCurrency,
  updateDeposit,
  updateWithdrawal,
  updateTrading,
  updateStock,
  updateMLM,
  updateHomepage,
  updateNotification,
  updateSecurity,
};
