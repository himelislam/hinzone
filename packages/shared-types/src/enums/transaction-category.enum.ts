// tasks/phase-04.md - Transaction Categories. New categories can be appended here
// without a schema redesign (transaction.model.ts stores category as a string enum).
export enum TransactionCategory {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  BUY_STOCK = 'BUY_STOCK',
  SELL_STOCK = 'SELL_STOCK',
  MLM_BONUS = 'MLM_BONUS',
  RANK_REWARD = 'RANK_REWARD',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
  REFUND = 'REFUND',
  REVERSAL = 'REVERSAL',
}
