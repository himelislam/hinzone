import { Schema, model } from 'mongoose';
import type { HydratedDocument, Model } from 'mongoose';

import type { ISession } from './auth.types';

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    operatingSystem: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1 });
sessionSchema.index({ expiresAt: 1 });

export type SessionDocument = HydratedDocument<ISession>;
export type SessionModel = Model<ISession>;

export const Session = model<ISession, SessionModel>('Session', sessionSchema, 'sessions');
