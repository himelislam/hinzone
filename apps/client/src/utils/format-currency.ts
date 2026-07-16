// Every monetary figure across the wallet UI (BalanceCard, WalletCard,
// WalletSummary, TransactionTable) goes through this instead of a bare
// `amount.toFixed(2)` - keeps thousands separators and decimal precision
// consistent everywhere (ui_rules.md #31 - "do not manually format currency
// values throughout the application"). currencySymbol/decimalPrecision come from
// CurrencySettings (docs/20-settings-system.md #9); this function stays a pure
// formatter rather than reading Settings itself, so the components calling it
// stay presentational - the caller (a page, once Settings are wired in) passes
// them down.
export const formatCurrency = (
  amount: number,
  currencySymbol = '',
  decimalPrecision = 2,
): string => {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimalPrecision,
    maximumFractionDigits: decimalPrecision,
  });

  return currencySymbol ? `${currencySymbol}${formatted}` : formatted;
};
