// tasks/phase-06.md - Withdrawal Status. Only COMPLETED withdrawals ever
// decrease wallet balances (docs/10-withdraw-module.md #6: "Only Completed
// withdrawals permanently reduce the wallet balance."); APPROVED/PROCESSING
// are administrative checkpoints that track payout progress without moving
// money, and REJECTED/CANCELLED leave the wallet untouched entirely (same
// enum-for-fixed-values pattern as DepositStatus/TransactionStatus).
export enum WithdrawalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
