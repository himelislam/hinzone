import { Types } from 'mongoose';
import type { ClientSession, QueryFilter } from 'mongoose';
import type { WithdrawalStatus } from 'shared-types';

import { escapeRegExp } from '@/shared/helpers/escape-regex';

import { Withdrawal } from './withdrawal.model';
import type {
  CreateWithdrawalInput,
  IWithdrawal,
  PaginatedWithdrawals,
  UpdateWithdrawalStatusInput,
  WithdrawalDocument,
  WithdrawalFilters,
  WithdrawalListOptions,
  WithdrawalSortBy,
} from './withdrawal.types';

const create = async (
  data: CreateWithdrawalInput,
  session?: ClientSession,
): Promise<WithdrawalDocument> => {
  const [withdrawal] = await Withdrawal.create([data], { session });
  return withdrawal;
};

const findById = async (
  id: string,
  session?: ClientSession,
): Promise<WithdrawalDocument | null> => {
  return Withdrawal.findById(id)
    .session(session ?? null)
    .exec();
};

const findByWithdrawalNumber = async (
  withdrawalNumber: string,
): Promise<WithdrawalDocument | null> => {
  return Withdrawal.findOne({ withdrawalNumber }).exec();
};

const buildFilterQuery = (
  filters: WithdrawalFilters,
  scope: QueryFilter<IWithdrawal> = {},
): QueryFilter<IWithdrawal> => {
  const query: QueryFilter<IWithdrawal> = { ...scope };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.paymentMethod) {
    query.paymentMethod = filters.paymentMethod;
  }

  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {
      ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
    };
  }

  if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
    query.amount = {
      ...(filters.minAmount !== undefined ? { $gte: filters.minAmount } : {}),
      ...(filters.maxAmount !== undefined ? { $lte: filters.maxAmount } : {}),
    };
  }

  // tasks/phase-06.md's Search & Filtering - matches withdrawalNumber only,
  // same single-collection boundary as deposit.repository.ts's buildFilterQuery.
  const search = filters.search?.trim();

  if (search) {
    query.withdrawalNumber = new RegExp(escapeRegExp(search), 'i');
  }

  return query;
};

// tasks/phase-06.md - Search & Filtering > Sorting.
const SORT_BY_TO_QUERY: Record<WithdrawalSortBy, Record<string, 1 | -1>> = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highestAmount: { amount: -1 },
  lowestAmount: { amount: 1 },
};

const paginate = async (
  query: QueryFilter<IWithdrawal>,
  options: WithdrawalListOptions,
): Promise<PaginatedWithdrawals> => {
  const sort = SORT_BY_TO_QUERY[options.sortBy ?? 'latest'];
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    Withdrawal.find(query).sort(sort).skip(skip).limit(options.limit).exec(),
    Withdrawal.countDocuments(query).exec(),
  ]);

  return { items, total };
};

const findByUserId = async (
  userId: Types.ObjectId,
  options: WithdrawalListOptions,
  filters: WithdrawalFilters = {},
): Promise<PaginatedWithdrawals> => {
  return paginate(buildFilterQuery(filters, { userId }), options);
};

// Admin-facing, cross-user query - backs GET /api/v1/admin/withdrawals.
// `filters.userId` (tasks/phase-06.md's Search & Filtering "User" field), if
// present, is applied here as a scope, exactly like findByUserId's own
// ownership scope above - buildFilterQuery itself never reads filters.userId,
// so this is the only code path that ever consults it, and findByUserId
// (the user-facing list) can never have its ownership scope overridden by it.
const findAllAdmin = async (
  options: WithdrawalListOptions,
  filters: WithdrawalFilters = {},
): Promise<PaginatedWithdrawals> => {
  const scope = filters.userId ? { userId: new Types.ObjectId(filters.userId) } : {};

  return paginate(buildFilterQuery(filters, scope), options);
};

// Applies the approve/reject/processing/complete/cancel status transition
// atomically alongside whichever reviewer/processing/completion fields apply
// (tasks/phase-06.md's Approval/Rejection/Processing/Completion workflows).
// `fromStatuses` is a query-level precondition (status: { $in: fromStatuses }),
// not just an in-memory check the caller already performed - without it, two
// concurrent transitions on the same withdrawal (e.g. an approve and a reject
// racing) could both pass their own in-memory guard before either write
// commits, and this unconditional findByIdAndUpdate would let both writes
// land, leaving a self-contradicting persisted state (e.g. status REJECTED
// but reviewedBy/reviewedAt set as if approved). When the filter matches zero
// documents (status changed between the caller's read and this write), this
// returns null and the caller must treat that as an invalid transition, not
// as "not found".
const updateStatus = async (
  id: Types.ObjectId,
  fromStatuses: readonly WithdrawalStatus[],
  update: UpdateWithdrawalStatusInput,
  session?: ClientSession,
): Promise<WithdrawalDocument | null> => {
  return Withdrawal.findOneAndUpdate({ _id: id, status: { $in: fromStatuses } }, update, {
    new: true,
    session,
  }).exec();
};

export const withdrawalRepository = {
  create,
  findById,
  findByWithdrawalNumber,
  findByUserId,
  findAllAdmin,
  updateStatus,
};
