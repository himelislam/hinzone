import { Schema, model } from 'mongoose';
import { TRANSACTION_CATEGORIES, TRANSACTION_STATUSES, TRANSACTION_TYPES } from 'shared-constants';
import { TransactionStatus } from 'shared-types';

import type { ITransaction, TransactionModel } from './transaction.types';

// Transactions are immutable after creation except for `status` transitioning
// (database_rules.md #16) - there is deliberately no updatedAt, matching
// audit-log.model.ts's precedent for immutable collections. `amount`,
// `balanceBefore`, and `balanceAfter` all carry `min: 0` as defense-in-depth
// alongside WalletService's own checks (database_rules.md #13/#18).
const transactionSchema = new Schema<ITransaction, TransactionModel>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: TransactionStatus.PENDING,
    },
    description: {
      type: String,
    },
    referenceId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound indexes follow database_rules.md #10's documented common query
// patterns; walletId/category/type are also indexed individually for
// tasks/phase-04.md's Transaction Filtering requirements.
transactionSchema.index({ walletId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ type: 1 });

export const Transaction = model<ITransaction, TransactionModel>(
  'Transaction',
  transactionSchema,
  'transactions',
);
