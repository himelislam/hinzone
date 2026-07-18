import type { WithdrawalStatus } from '../enums/withdrawal-status.enum';

// API-facing withdrawal shape (tasks/phase-06.md - Withdrawal Schema).
// `amount` is the gross amount requested (and the amount ultimately debited
// from the wallet); `withdrawalFee`/`netAmount` are derived at request time
// from the Settings-driven fee percentage and never recomputed afterward.
// Immutable once created except for the status/review/processing/completion
// fields, which only change through the admin approve/reject/processing/
// complete workflow (docs/10-withdraw-module.md).
export interface Withdrawal {
  id: string;
  withdrawalNumber: string;
  userId: string;
  walletId: string;
  amount: number;
  withdrawalFee: number;
  netAmount: number;
  currency: string;
  paymentMethod: string;
  receiverAccountNumber: string;
  accountHolderName: string;
  status: WithdrawalStatus;
  adminNote?: string;
  rejectionReason?: string;
  // Set on approve OR reject (whichever reviewer action happens first) -
  // named generically, not "approvedBy", since it also records who rejected
  // a withdrawal (mirrors Deposit's reviewedBy field for the same reason).
  reviewedBy?: string;
  reviewedAt?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Recomputed on demand, not stored - only populated on the admin
  // GET-by-id response (tasks/phase-06.md's Admin Approval Screen "Waiting
  // Period Validation Result"), since a user's eligibility can change
  // between submission and admin review.
  waitingPeriodSatisfied?: boolean;
}
