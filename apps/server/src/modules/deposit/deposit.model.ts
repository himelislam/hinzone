import { Schema, model } from 'mongoose';
import { DEPOSIT_STATUSES } from 'shared-constants';
import { DepositStatus } from 'shared-types';

import type { DepositModel, IDeposit } from './deposit.types';

// tasks/phase-05.md - Deposit Schema. `amount` carries `min: 0` as defense-in-depth
// alongside DepositService's own settings-driven validation (database_rules.md
// #13/#18), same reasoning as transaction.model.ts's amount/balance fields.
// `currency` has no default - it always comes from the caller's wallet, never
// hardcoded here (coding_rules.md #14).
const depositSchema = new Schema<IDeposit, DepositModel>(
  {
    depositNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    senderAccountNumber: {
      type: String,
      required: true,
    },
    paymentReference: {
      type: String,
      required: true,
    },
    screenshotUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: DEPOSIT_STATUSES,
      default: DepositStatus.PENDING,
    },
    adminNote: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Mirrors transaction.model.ts's compound-index choices for the same query
// patterns: a user's own deposit history sorted by date, and admin filtering by
// status/payment method across all users (database_rules.md #10).
depositSchema.index({ userId: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });
depositSchema.index({ paymentMethod: 1 });

export const Deposit = model<IDeposit, DepositModel>('Deposit', depositSchema, 'deposits');
