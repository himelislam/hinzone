import type { QueryFilter } from 'mongoose';

import { User } from './users.model';
import type { IUser, PaginatedUsers, PaginationOptions, UserDocument } from './users.types';

const create = async (data: Partial<IUser>): Promise<UserDocument> => {
  return User.create(data);
};

const findById = async (
  id: string,
  options: { withPassword?: boolean } = {},
): Promise<UserDocument | null> => {
  const query = User.findById(id);
  return options.withPassword ? query.select('+password').exec() : query.exec();
};

const findByUsername = async (
  username: string,
  options: { withPassword?: boolean } = {},
): Promise<UserDocument | null> => {
  const query = User.findOne({ username: username.toLowerCase() });
  return options.withPassword ? query.select('+password').exec() : query.exec();
};

const findByEmail = async (email: string): Promise<UserDocument | null> => {
  return User.findOne({ email: email.toLowerCase() }).exec();
};

const findByPhoneNumber = async (phoneNumber: string): Promise<UserDocument | null> => {
  return User.findOne({ phoneNumber }).exec();
};

const findByReferralId = async (referralId: string): Promise<UserDocument | null> => {
  return User.findOne({ referralId: referralId.toUpperCase() }).exec();
};

// Login accepts username, phone number, or email in a single field
// (docs/07-authentication.md #10) - one $or query beats three sequential lookups.
const findByLoginIdentifier = async (
  identifier: string,
  options: { withPassword?: boolean } = {},
): Promise<UserDocument | null> => {
  const trimmed = identifier.trim();
  const normalized = trimmed.toLowerCase();

  const query = User.findOne({
    $or: [{ username: normalized }, { phoneNumber: trimmed }, { email: normalized }],
  });

  return options.withPassword ? query.select('+password').exec() : query.exec();
};

const updateById = async (id: string, update: Partial<IUser>): Promise<UserDocument | null> => {
  return User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
};

// `findByIdAndUpdate` bypasses Mongoose document middleware, so it must never be used
// for password changes - it would persist the plaintext value, skipping the model's
// pre('save') hashing hook entirely. Loading the document and calling `.save()` is
// what makes the hook fire.
const updatePassword = async (id: string, newPassword: string): Promise<UserDocument | null> => {
  const user = await User.findById(id).exec();

  if (!user) {
    return null;
  }

  user.password = newPassword;
  await user.save();

  return user;
};

// Atomic increment - avoids a lost-update race under concurrent failed login
// attempts that a read-modify-write via updateById would be exposed to.
const incrementLoginAttempts = async (id: string): Promise<UserDocument | null> => {
  return User.findByIdAndUpdate(id, { $inc: { loginAttempts: 1 } }, { new: true }).exec();
};

const lockAccountUntil = async (id: string, lockedUntil: Date): Promise<UserDocument | null> => {
  return User.findByIdAndUpdate(id, { accountLockedUntil: lockedUntil }, { new: true }).exec();
};

const list = async (
  options: PaginationOptions,
  filter: QueryFilter<IUser> = {},
): Promise<PaginatedUsers> => {
  const sortField = options.sort ?? 'createdAt';
  const sortOrder = options.order === 'asc' ? 1 : -1;
  const skip = (options.page - 1) * options.limit;

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(options.limit)
      .exec(),
    User.countDocuments(filter).exec(),
  ]);

  return { items, total };
};

export const userRepository = {
  create,
  findById,
  findByUsername,
  findByEmail,
  findByPhoneNumber,
  findByReferralId,
  findByLoginIdentifier,
  updateById,
  updatePassword,
  incrementLoginAttempts,
  lockAccountUntil,
  list,
};
