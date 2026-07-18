import type { ClientSession, QueryFilter, Types } from 'mongoose';
import { DepositStatus } from 'shared-types';

import { escapeRegExp } from '@/shared/helpers/escape-regex';

import { Deposit } from './deposit.model';
import type {
  CreateDepositInput,
  DepositDocument,
  DepositFilters,
  DepositListOptions,
  DepositSortBy,
  IDeposit,
  PaginatedDeposits,
  UpdateDepositStatusInput,
} from './deposit.types';

const create = async (
  data: CreateDepositInput,
  session?: ClientSession,
): Promise<DepositDocument> => {
  const [deposit] = await Deposit.create([data], { session });
  return deposit;
};

const findById = async (id: string, session?: ClientSession): Promise<DepositDocument | null> => {
  return Deposit.findById(id)
    .session(session ?? null)
    .exec();
};

const findByDepositNumber = async (depositNumber: string): Promise<DepositDocument | null> => {
  return Deposit.findOne({ depositNumber }).exec();
};

// tasks/breakdown/phase-06-tasks.md task 10 - backs WithdrawalService's
// waiting-period check (tasks/phase-06.md's "Latest Eligible Deposit"): a
// user's withdrawal eligibility clock starts from their very first APPROVED
// deposit. Read-only and additive - does not change any existing deposit
// behavior.
const findEarliestApprovedByUserId = async (
  userId: Types.ObjectId,
): Promise<DepositDocument | null> => {
  return Deposit.findOne({ userId, status: DepositStatus.APPROVED }).sort({ createdAt: 1 }).exec();
};

const buildFilterQuery = (
  filters: DepositFilters,
  scope: QueryFilter<IDeposit> = {},
): QueryFilter<IDeposit> => {
  const query: QueryFilter<IDeposit> = { ...scope };

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

  // tasks/phase-05.md's Search & Filtering - matches depositNumber only, same
  // single-collection boundary as transaction.repository.ts's buildFilterQuery.
  const search = filters.search?.trim();

  if (search) {
    query.depositNumber = new RegExp(escapeRegExp(search), 'i');
  }

  return query;
};

// tasks/phase-05.md - Search & Filtering > Sorting.
const SORT_BY_TO_QUERY: Record<DepositSortBy, Record<string, 1 | -1>> = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highestAmount: { amount: -1 },
  lowestAmount: { amount: 1 },
};

const paginate = async (
  query: QueryFilter<IDeposit>,
  options: DepositListOptions,
): Promise<PaginatedDeposits> => {
  const sort = SORT_BY_TO_QUERY[options.sortBy ?? 'latest'];
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    Deposit.find(query).sort(sort).skip(skip).limit(options.limit).exec(),
    Deposit.countDocuments(query).exec(),
  ]);

  return { items, total };
};

const findByUserId = async (
  userId: Types.ObjectId,
  options: DepositListOptions,
  filters: DepositFilters = {},
): Promise<PaginatedDeposits> => {
  return paginate(buildFilterQuery(filters, { userId }), options);
};

// Admin-facing, cross-user query (no userId scope applied) - backs
// GET /api/v1/admin/deposits.
const findAllAdmin = async (
  options: DepositListOptions,
  filters: DepositFilters = {},
): Promise<PaginatedDeposits> => {
  return paginate(buildFilterQuery(filters), options);
};

// Applies the approve/reject/cancel status transition atomically alongside
// whichever reviewer fields apply (tasks/phase-05.md's Approval/Rejection
// workflows) - the caller (DepositService, a later task) decides which fields
// are present in `update`.
const updateStatus = async (
  id: Types.ObjectId,
  update: UpdateDepositStatusInput,
  session?: ClientSession,
): Promise<DepositDocument | null> => {
  return Deposit.findByIdAndUpdate(id, update, { new: true, session }).exec();
};

export const depositRepository = {
  create,
  findById,
  findByDepositNumber,
  findEarliestApprovedByUserId,
  findByUserId,
  findAllAdmin,
  updateStatus,
};
