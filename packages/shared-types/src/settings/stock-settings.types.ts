export type StockPriceUpdateMode = 'manual' | 'automatic';

export interface StockSettings {
  enabled: boolean;
  autoSellEnabled: boolean;
  minimumPurchase: number;
  maximumPurchase: number;
  fractionalSharesEnabled: boolean;
  priceUpdateMode: StockPriceUpdateMode;
  autoSellIntervalMinutes: number;
}
