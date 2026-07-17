// tasks/phase-05.md - Deposit Status. Only APPROVED deposits ever affect wallet
// balances; REJECTED/CANCELLED leave the wallet untouched (same enum-for-fixed-
// values pattern as TransactionStatus/WalletStatus).
export enum DepositStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}
