import type { CreatePasswordResetTokenInput } from './auth.types';
import { PasswordResetToken } from './password-reset-token.model';
import type { PasswordResetTokenDocument } from './password-reset-token.model';

const create = async (data: CreatePasswordResetTokenInput): Promise<PasswordResetTokenDocument> => {
  return PasswordResetToken.create(data);
};

const findByTokenHash = async (tokenHash: string): Promise<PasswordResetTokenDocument | null> => {
  return PasswordResetToken.findOne({ tokenHash }).exec();
};

const markUsed = async (tokenHash: string): Promise<void> => {
  await PasswordResetToken.updateOne({ tokenHash }, { used: true }).exec();
};

export const passwordResetTokenRepository = {
  create,
  findByTokenHash,
  markUsed,
};
