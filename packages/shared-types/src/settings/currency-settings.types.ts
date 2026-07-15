// Every financial calculation elsewhere in the platform (wallet, deposits,
// withdrawals, trading) reads its exchange rate from here rather than hardcoding
// one (docs/20-settings-system.md #9, #25).
export interface CurrencySettings {
  defaultCurrency: string;
  currencySymbol: string;
  usdToBdtRate: number;
  bdtToUsdRate: number;
  decimalPrecision: number;
}
