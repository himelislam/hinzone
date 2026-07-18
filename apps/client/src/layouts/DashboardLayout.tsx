import type { JSX } from 'react';

import DashboardShell from './DashboardShell';

const DASHBOARD_NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Wallet', to: '/wallet' },
  { label: 'Deposits', to: '/deposits' },
  { label: 'Withdrawals', to: '/withdrawals' },
  { label: 'Stocks', to: '/stocks' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'History', to: '/history' },
  { label: 'Refer', to: '/refer' },
  { label: 'Trade', to: '/trade' },
  { label: 'Notifications', to: '/notifications' },
  { label: 'Settings', to: '/settings' },
  { label: 'Profile', to: '/profile' },
] as const;

const DashboardLayout = (): JSX.Element => {
  return <DashboardShell title="Stock Investment Platform" navItems={DASHBOARD_NAV_ITEMS} />;
};

export default DashboardLayout;
