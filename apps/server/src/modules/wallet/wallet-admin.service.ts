import type { QueryFilter } from 'mongoose';
import { Types } from 'mongoose';
import { TransactionType } from 'shared-types';
import type { TransactionCategory, WalletStatus } from 'shared-types';

import { auditLogRepository } from '../audit-log/audit-log.repository';
import { AUDIT_ACTIONS } from '../audit-log/audit-log.types';
import type { AuditContext } from '../audit-log/audit-log.types';

import { walletRepository } from './wallet.repository';
import { walletService } from './wallet.service';
import type { WalletMutationResult } from './wallet.service';
import type { IWallet, PaginatedWallets, PaginationOptions } from './wallet.types';

export interface AdminWalletListFilters {
  status?: WalletStatus;
}

const listWallets = async (
  options: PaginationOptions,
  filters: AdminWalletListFilters = {},
): Promise<PaginatedWallets> => {
  const query: QueryFilter<IWallet> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  return walletRepository.list(options, query);
};

// Direct references rather than wrapper functions - matches
// admin-users.service.ts's `const getUserById = userService.getUserById;`
// precedent for this exact "thin admin-layer passthrough" case.
const getWalletById = walletService.getWallet;
const getWalletByUserId = walletService.getWalletByUser;

export interface AdjustWalletInput {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  reason: string;
}

// POST /api/v1/admin/wallets/:id/adjust (Task D) - tasks/phase-04.md's Wallet
// Adjustment Rules: "Admin adjustments -> Wallet Transaction -> Audit Log ->
// Notification. Never silently change balances." The notification step is the
// WalletCredited/WalletDebited event walletService.credit/debit already emits
// (wallet.events.ts) - a future NotificationService subscribes there; this
// service does not reach into a notification module that doesn't exist yet.
const adjustWallet = async (
  walletId: string,
  input: AdjustWalletInput,
  adminId: string,
  context: AuditContext = {},
): Promise<WalletMutationResult> => {
  const wallet = await walletService.getWallet(walletId);

  const mutate = input.type === TransactionType.CREDIT ? walletService.credit : walletService.debit;

  const result = await mutate(walletId, {
    category: input.category,
    amount: input.amount,
    currency: wallet.currency,
    description: input.reason,
    createdBy: adminId,
  });

  // tasks/phase-04.md's Audit Logs section: "Record: Balance Before, Balance
  // After, Adjustment Reason, Admin, Timestamp." Admin = userId below,
  // Timestamp = createdAt (automatic).
  await auditLogRepository.create({
    userId: new Types.ObjectId(adminId),
    action: AUDIT_ACTIONS.WALLET_ADJUSTED,
    entity: 'Wallet',
    entityId: walletId,
    before: { balance: result.transaction.balanceBefore },
    after: {
      balance: result.transaction.balanceAfter,
      reason: input.reason,
      type: input.type,
      category: input.category,
      amount: input.amount,
    },
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });

  return result;
};

export const walletAdminService = {
  listWallets,
  getWalletById,
  getWalletByUserId,
  adjustWallet,
};
