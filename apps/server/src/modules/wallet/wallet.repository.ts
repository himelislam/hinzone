import type { ClientSession, QueryFilter, Types } from 'mongoose';
import type { WalletStatus } from 'shared-types';

import { Wallet } from './wallet.model';
import type {
  CreateWalletInput,
  IWallet,
  PaginatedWallets,
  PaginationOptions,
  WalletBalanceIncrements,
  WalletDocument,
} from './wallet.types';

const create = async (
  data: CreateWalletInput,
  session?: ClientSession,
): Promise<WalletDocument> => {
  const [wallet] = await Wallet.create([data], { session });
  return wallet;
};

const findById = async (id: string, session?: ClientSession): Promise<WalletDocument | null> => {
  return Wallet.findById(id)
    .session(session ?? null)
    .exec();
};

const findByUserId = async (
  userId: Types.ObjectId,
  session?: ClientSession,
): Promise<WalletDocument | null> => {
  return Wallet.findOne({ userId })
    .session(session ?? null)
    .exec();
};

// Atomic $inc keeps concurrent credit/debit calls from racing on a
// read-modify-write (database_rules.md #13/#20). WalletService (Task C) is
// responsible for checking sufficient balance and opening the MongoDB session
// before calling this - the repository layer only ever applies the increments.
const updateBalance = async (
  walletId: Types.ObjectId,
  increments: WalletBalanceIncrements,
  session?: ClientSession,
): Promise<WalletDocument | null> => {
  return Wallet.findByIdAndUpdate(
    walletId,
    { $inc: increments },
    { new: true, runValidators: true, session },
  ).exec();
};

const updateStatus = async (
  walletId: Types.ObjectId,
  status: WalletStatus,
  session?: ClientSession,
): Promise<WalletDocument | null> => {
  return Wallet.findByIdAndUpdate(walletId, { status }, { new: true, session }).exec();
};

const list = async (
  options: PaginationOptions,
  filter: QueryFilter<IWallet> = {},
): Promise<PaginatedWallets> => {
  const sortField = options.sort ?? 'createdAt';
  const sortOrder = options.order === 'asc' ? 1 : -1;
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    Wallet.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(options.limit)
      .exec(),
    Wallet.countDocuments(filter).exec(),
  ]);

  return { items, total };
};

export const walletRepository = {
  create,
  findById,
  findByUserId,
  updateBalance,
  updateStatus,
  list,
};
