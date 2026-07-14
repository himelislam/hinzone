import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import ProfileCard from '@/components/cards/ProfileCard';
import LoadingState from '@/components/common/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

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

  if (isLoading || !user) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user.fullName.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">Here's a snapshot of your account.</p>
      </div>

      <ProfileCard user={user} />

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
