import { Schema, model } from 'mongoose';
import { WITHDRAWAL_STATUSES } from 'shared-constants';
import { WithdrawalStatus } from 'shared-types';

import type { IWithdrawal, WithdrawalModel } from './withdrawal.types';

// tasks/phase-06.md - Withdrawal Schema. `amount`/`withdrawalFee`/`netAmount`
// all carry `min: 0` as defense-in-depth alongside WithdrawalService's own
// settings-driven validation (database_rules.md #13/#18), same reasoning as
// deposit.model.ts's amount field. `currency` has no default - it always
// comes from the caller's wallet, never hardcoded here (coding_rules.md #14).
const withdrawalSchema = new Schema<IWithdrawal, WithdrawalModel>(
  {
    withdrawalNumber: {
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
    withdrawalFee: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
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
    receiverAccountNumber: {
      type: String,
      required: true,
    },
    accountHolderName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: WITHDRAWAL_STATUSES,
      default: WithdrawalStatus.PENDING,
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
    processedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Mirrors deposit.model.ts's compound-index choices for the same query
// patterns: a user's own withdrawal history sorted by date, and admin
// filtering by status/payment method across all users (database_rules.md #10).
// paymentMethod is compounded with createdAt (unlike deposit.model.ts's
// standalone version) so an admin list filtered only by payment method - the
// default sort is always "latest" (withdrawal.types.ts's WITHDRAWAL_SORT_OPTIONS)
// - can satisfy both the filter and the sort from one index instead of an
// in-memory sort stage.
withdrawalSchema.index({ userId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });
withdrawalSchema.index({ paymentMethod: 1, createdAt: -1 });
// tasks/phase-06.md's Performance > Indexes explicitly names Wallet ID - no
// current repository query filters by it alone, but it's a foreign-key
// reference worth indexing for future admin lookups (e.g. "all withdrawals
// against this wallet").
withdrawalSchema.index({ walletId: 1 });

export const Withdrawal = model<IWithdrawal, WithdrawalModel>(
  'Withdrawal',
  withdrawalSchema,
  'withdrawals',
);
