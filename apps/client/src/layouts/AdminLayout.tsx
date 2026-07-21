import type { JSX } from 'react';

import DashboardShell from './DashboardShell';

const ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Deposits', to: '/admin/deposits' },
  { label: 'Withdrawals', to: '/admin/withdrawals' },
  { label: 'Stocks', to: '/admin/stocks' },
  { label: 'Settings', to: '/admin/settings' },
] as const;

const AdminLayout = (): JSX.Element => {
  return <DashboardShell title="Admin Panel" navItems={ADMIN_NAV_ITEMS} />;
};

export default AdminLayout;
