import type { ClientSession, QueryFilter, Types } from 'mongoose';

import { escapeRegExp } from '@/shared/helpers/escape-regex';

import { Transaction } from './transaction.model';
import type {
  CreateTransactionInput,
  ITransaction,
  PaginatedTransactions,
  TransactionDocument,
  TransactionFilters,
  TransactionListOptions,
  TransactionSortBy,
} from './transaction.types';

const create = async (
  data: CreateTransactionInput,
  session?: ClientSession,
): Promise<TransactionDocument> => {
  const [transaction] = await Transaction.create([data], { session });
  return transaction;
};

const findById = async (id: string): Promise<TransactionDocument | null> => {
  return Transaction.findById(id).exec();
};

const buildFilterQuery = (
  filters: TransactionFilters,
  scope: QueryFilter<ITransaction> = {},
): QueryFilter<ITransaction> => {
  const query: QueryFilter<ITransaction> = { ...scope };

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
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

  // tasks/phase-04.md's Transaction History > Features: Search - matches
  // transactionNumber or description, same case-insensitive escaped-regex
  // pattern as users-admin.service.ts's listUsers search.
  const search = filters.search?.trim();

  if (search) {
    const pattern = new RegExp(escapeRegExp(search), 'i');
    query.$or = [{ transactionNumber: pattern }, { description: pattern }];
  }

  return query;
};

// tasks/phase-04.md - Transaction Filtering > Sorting.
const SORT_BY_TO_QUERY: Record<TransactionSortBy, Record<string, 1 | -1>> = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highestAmount: { amount: -1 },
  lowestAmount: { amount: 1 },
};

const paginate = async (
  query: QueryFilter<ITransaction>,
  options: TransactionListOptions,
): Promise<PaginatedTransactions> => {
  const sort = SORT_BY_TO_QUERY[options.sortBy ?? 'latest'];
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    Transaction.find(query).sort(sort).skip(skip).limit(options.limit).exec(),
    Transaction.countDocuments(query).exec(),
  ]);

  return { items, total };
};

const findByWalletId = async (
  walletId: Types.ObjectId,
  options: TransactionListOptions,
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> => {
  return paginate(buildFilterQuery(filters, { walletId }), options);
};

// Admin-facing, cross-user query (no walletId/userId scope applied) - backs
// GET /api/v1/admin/wallets and future admin transaction reporting.
const list = async (
  options: TransactionListOptions,
  filters: TransactionFilters = {},
): Promise<PaginatedTransactions> => {
  return paginate(buildFilterQuery(filters), options);
};

export const transactionRepository = {
  create,
  findById,
  findByWalletId,
  list,
};
