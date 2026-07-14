import type { Types } from 'mongoose';

import type { CreateRefreshTokenInput } from './auth.types';
import { RefreshToken } from './refresh-token.model';
import type { RefreshTokenDocument } from './refresh-token.model';

const create = async (data: CreateRefreshTokenInput): Promise<RefreshTokenDocument> => {
  return RefreshToken.create(data);
};

const findByTokenHash = async (tokenHash: string): Promise<RefreshTokenDocument | null> => {
  return RefreshToken.findOne({ tokenHash }).exec();
};

const revokeByTokenHash = async (tokenHash: string): Promise<void> => {
  await RefreshToken.updateOne({ tokenHash }, { revoked: true }).exec();
};

const revokeAllForUser = async (userId: Types.ObjectId): Promise<void> => {
  await RefreshToken.updateMany({ userId, revoked: false }, { revoked: true }).exec();
};

export const refreshTokenRepository = {
  create,
  findByTokenHash,
  revokeByTokenHash,
  revokeAllForUser,
};
