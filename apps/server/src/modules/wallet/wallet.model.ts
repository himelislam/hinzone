import { Schema, model } from 'mongoose';
import { WALLET_STATUSES } from 'shared-constants';
import { WalletStatus } from 'shared-types';

import type { IWallet, WalletModel } from './wallet.types';

// One wallet per user (tasks/phase-04.md - Wallet Schema). Balances default to 0
// (a structural initial-state default, same class as users.model.ts's
// loginAttempts default) and `min: 0` on every running-total field is
// defense-in-depth against a negative balance, complementing rather than
// replacing WalletService's own checks (database_rules.md #13/#18).
// `currency` has no default - it is only ever set by WalletService from the
// Settings-driven currency config, never hardcoded here (coding_rules.md #14).
const walletSchema = new Schema<IWallet, WalletModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalDeposited: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalWithdrawn: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // No `min: 0` here, unlike its siblings - net profit can be negative
    // (an overall loss) and that is a valid, expected state.
    totalProfit: {
      type: Number,
      required: true,
      default: 0,
    },
    totalInvestment: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: WALLET_STATUSES,
      default: WalletStatus.ACTIVE,
    },
  },
  { timestamps: true },
);

export const Wallet = model<IWallet, WalletModel>('Wallet', walletSchema, 'wallets');
