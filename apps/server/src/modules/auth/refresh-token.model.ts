import { Schema, model } from 'mongoose';
import type { HydratedDocument, Model } from 'mongoose';

import type { IRefreshToken } from './auth.types';

// The raw JWT is never persisted - only a hash of it - per backend_rules.md's
// "never store refresh tokens in plaintext" rule.
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
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
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;
export type RefreshTokenModel = Model<IRefreshToken>;

export const RefreshToken = model<IRefreshToken, RefreshTokenModel>(
  'RefreshToken',
  refreshTokenSchema,
  'refreshTokens',
);
