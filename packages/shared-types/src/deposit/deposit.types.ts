import type { DepositStatus } from '../enums/deposit-status.enum';

// API-facing deposit shape (tasks/phase-05.md - Deposit Schema). `paymentReference`
// is the user-submitted bKash/Nagad transaction reference - named distinctly from
// the wallet ledger's Transaction model (shared-types' Transaction) to avoid the
// two concepts being confused. Immutable once created except for the status/
// review fields, which only change through the admin approve/reject workflow.
export interface Deposit {
  id: string;
  depositNumber: string;
  userId: string;
  walletId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  senderAccountNumber: string;
  paymentReference: string;
  screenshotUrl: string;
  status: DepositStatus;
  adminNote?: string;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}
