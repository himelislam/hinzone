// tasks/phase-07.md - Stock Status. Only ACTIVE stock is ever tradable or
// publicly listable; INACTIVE/SUSPENDED/ARCHIVED are all admin-visible-only
// states that hide a stock from the public catalog without deleting it (same
// enum-for-fixed-values pattern as DepositStatus/WithdrawalStatus).
export enum StockStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}
