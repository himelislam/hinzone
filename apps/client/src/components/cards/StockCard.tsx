import type { JSX } from 'react';
import type { Stock } from 'shared-types';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import StockPriceCard from './StockPriceCard';

interface StockCardProps {
  readonly stock: Stock;
  readonly onClick?: (stock: Stock) => void;
  readonly currencySymbol?: string;
  readonly decimalPrecision?: number;
}

// Catalog-listing card: logo, company, symbol, StockPriceCard, category -
// used on the public Stock Listing page (docs/17's listing-density
// convention for catalog pages).
const StockCard = ({
  stock,
  onClick,
  currencySymbol,
  decimalPrecision,
}: StockCardProps): JSX.Element => (
  <Card
    onClick={onClick ? (): void => onClick(stock) : undefined}
    className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : undefined}
  >
    <CardHeader className="flex-row items-center gap-3">
      {stock.logoUrl ? (
        <img
          src={stock.logoUrl}
          alt={`${stock.companyName} logo`}
          className="border-border h-10 w-10 rounded-full border object-contain"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold">
          {stock.symbol.slice(0, 2)}
        </div>
      )}
      <div>
        <p className="text-sm font-semibold">{stock.companyName}</p>
        <p className="text-muted-foreground text-xs">
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

export default StockCard;
