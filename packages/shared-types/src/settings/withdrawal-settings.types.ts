export interface WithdrawalSettings {
  enabled: boolean;
  minimumWithdrawal: number;
  maximumWithdrawal: number;
  waitingPeriodDays: number;
  withdrawalFeePercentage: number;
  processingTimeHours: number;
  paymentMethods: string[];
}
