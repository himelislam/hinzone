import type { JSX } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format-currency';

interface StockPriceCardProps {
  readonly currentPrice: number;
  readonly previousPrice: number;
  readonly dailyChange: number;
  readonly dailyChangePercentage: number;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// Presentational current-price display with up/down styling
// (docs/17-ui-design-system.md's color conventions: success for gains,
// destructive for losses) - reused by StockCard/FeaturedStockCard, the stock
// details page, and the admin price-update confirmation view (phase-07.md's
// "Price Update Screen > Display" section). `dailyChange`'s own sign already
// carries the minus for a loss (formatCurrency doesn't strip it), so only
// the gain case needs an explicit "+" prefix.
const StockPriceCard = ({
  currentPrice,
  previousPrice,
  dailyChange,
  dailyChangePercentage,
  currencySymbol,
  decimalPrecision,
}: StockPriceCardProps): JSX.Element => {
  const isGain = dailyChange >= 0;
  const Icon = isGain ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-1">
      <p className="text-3xl font-semibold tabular-nums">
        {formatCurrency(currentPrice, currencySymbol, decimalPrecision)}
      </p>
      <div
        className={cn(
          'flex items-center gap-1 text-sm tabular-nums',
          isGain ? 'text-success' : 'text-destructive',
        )}
      >
        <Icon className="h-4 w-4" />
        <span>
          {isGain ? '+' : ''}
          {formatCurrency(dailyChange, currencySymbol, decimalPrecision)} ({isGain ? '+' : ''}
          {dailyChangePercentage.toFixed(2)}%)
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        Previous: {formatCurrency(previousPrice, currencySymbol, decimalPrecision)}
      </p>
    </div>
  );
};

export default StockPriceCard;
