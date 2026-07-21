import type { JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import FeaturedStockCard from '@/components/cards/FeaturedStockCard';
import ProfileCard from '@/components/cards/ProfileCard';
import LoadingState from '@/components/common/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencySettings } from '@/hooks/useSettingsQueries';
import { useFeaturedStocks } from '@/hooks/useStockQueries';

// Placeholders for modules not yet built (Wallet, Stocks, ...) - each becomes a
// real feature page in a later phase; this dashboard only needs stable links.
const QUICK_LINKS = [
  { label: 'Wallet', to: '/wallet', description: 'View balance and transactions.' },
  { label: 'Stocks', to: '/stocks', description: 'Browse available stocks.' },
  { label: 'Portfolio', to: '/portfolio', description: 'Track your holdings.' },
  { label: 'Trade', to: '/trade', description: 'Buy and sell stocks.' },
  { label: 'Refer', to: '/refer', description: 'Invite others and earn.' },
  { label: 'History', to: '/history', description: 'Review past activity.' },
] as const;

const DashboardPage = (): JSX.Element => {
  const { user, isLoading } = useAuth();
  // Supplementary, not load-bearing - phase-07.md's Featured Stocks "Used
  // on: ... Dashboard". A loading/error/empty featured-stocks fetch simply
  // hides this section rather than blocking or degrading the rest of the
  // dashboard (no ErrorState/LoadingState wired to it, unlike a primary
  // page's own data).
  const featuredStocksQuery = useFeaturedStocks();
  const currencySettingsQuery = useCurrencySettings();
  const navigate = useNavigate();

  if (isLoading || !user) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  const featuredStocks = featuredStocksQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user.fullName.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">Here's a snapshot of your account.</p>
      </div>

      <ProfileCard user={user} />

      {featuredStocks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured Stocks</h2>
            <Link to="/stocks/featured" className="text-primary text-sm hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredStocks.slice(0, 3).map((stock) => (
              <FeaturedStockCard
                key={stock.id}
                stock={stock}
                onClick={(clicked) => void navigate(`/stocks/${clicked.id}`)}
                currencySymbol={currencySettingsQuery.data?.currencySymbol}
                decimalPrecision={currencySettingsQuery.data?.decimalPrecision}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader>
                <CardTitle>{link.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
