import { Schema, model } from 'mongoose';
import type { HydratedDocument, Model } from 'mongoose';

import type { IPasswordResetToken } from './auth.types';

// The raw reset token is never persisted - only a hash of it - for the same reason
// refresh tokens are hashed (backend_rules.md: never store tokens in plaintext).
const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

passwordResetTokenSchema.index({ userId: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 });

export type PasswordResetTokenDocument = HydratedDocument<IPasswordResetToken>;
export type PasswordResetTokenModel = Model<IPasswordResetToken>;

export const PasswordResetToken = model<IPasswordResetToken, PasswordResetTokenModel>(
  'PasswordResetToken',
  passwordResetTokenSchema,
  'passwordResetTokens',
);
