import type { JSX } from 'react';
import type { Stock } from 'shared-types';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import StockPriceCard from './StockPriceCard';

interface FeaturedStockCardProps {
  readonly stock: Stock;
  readonly onClick?: (stock: Stock) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// A visually distinct, larger/highlighted variant of StockCard for the
// homepage/dashboard featured-stocks section (phase-07.md's Featured Stocks
// "Used on": Homepage, Dashboard, Investment Page) - same underlying
// StockPriceCard, just a bolder card treatment (accent border, bigger logo).
const FeaturedStockCard = ({
  stock,
  onClick,
  currencySymbol,
  decimalPrecision,
}: FeaturedStockCardProps): JSX.Element => (
  <Card
    onClick={onClick ? (): void => onClick(stock) : undefined}
    className={cn(
      'border-primary/40 bg-primary/5',
      onClick && 'cursor-pointer transition-shadow hover:shadow-lg',
    )}
  >
    <CardHeader className="flex-row items-center gap-4">
      {stock.logoUrl ? (
        <img
          src={stock.logoUrl}
          alt={`${stock.companyName} logo`}
          className="border-border h-14 w-14 rounded-full border object-contain"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold">
          {stock.symbol.slice(0, 2)}
        </div>
      )}
      <div>
        <p className="text-base font-semibold">{stock.companyName}</p>
        <p className="text-muted-foreground text-sm">
          {stock.symbol} · {stock.category}
        </p>
      </div>
    </CardHeader>
    <CardContent>
      <StockPriceCard
        currentPrice={stock.currentPrice}
        previousPrice={stock.previousPrice}
        dailyChange={stock.dailyChange}
        dailyChangePercentage={stock.dailyChangePercentage}
        currencySymbol={currencySymbol}
        decimalPrecision={decimalPrecision}
      />
    </CardContent>
  </Card>
);

export default FeaturedStockCard;
