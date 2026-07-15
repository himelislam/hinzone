import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { Card, CardDescription, CardTitle } from '@/components/ui/card';

interface SettingsCategoryLink {
  readonly title: string;
  readonly description: string;
  readonly to: string;
}

// One entry per category (docs/20-settings-system.md #6) - the single entry point
// under Administration -> Settings that phase-03.md's Admin Dashboard section
// calls for, linking out to each category's own page/form.
const SETTINGS_CATEGORY_LINKS: readonly SettingsCategoryLink[] = [
  {
    title: 'General',
    description: 'Platform identity and contact details.',
    to: '/admin/settings/general',
  },
  {
    title: 'Currency',
    description: 'Base currency and exchange rates.',
    to: '/admin/settings/currency',
  },
  {
    title: 'Deposit',
    description: 'Limits, packages, and payment methods.',
    to: '/admin/settings/deposit',
  },
  {
    title: 'Withdrawal',
    description: 'Limits, fees, and processing time.',
    to: '/admin/settings/withdrawal',
  },
  {
    title: 'Trading',
    description: 'Market hours and demo trading.',
    to: '/admin/settings/trading',
  },
  {
    title: 'Stocks',
    description: 'Purchase limits and price updates.',
    to: '/admin/settings/stocks',
  },
  { title: 'MLM', description: 'Referrals, commissions, and ranks.', to: '/admin/settings/mlm' },
  {
    title: 'Homepage',
    description: 'Public-facing homepage content.',
    to: '/admin/settings/homepage',
  },
  {
    title: 'Notification',
    description: 'Which events trigger notifications.',
    // SettingsCategory.NOTIFICATIONS is plural (docs/20-settings-system.md #21's
    // literal PUT /admin/settings/notifications route) - matches the route path
    // wired in AppRoutes.tsx below, not phase-03.md's singular example.
    to: '/admin/settings/notifications',
  },
  {
    title: 'Security',
    description: 'Sessions, login protection, and password policy.',
    to: '/admin/settings/security',
  },
] as const;

const AdminSettingsPage = (): JSX.Element => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Every configurable platform behavior lives here - changes apply immediately, no restart
          required.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SETTINGS_CATEGORY_LINKS.map((category) => (
          <Link key={category.to} to={category.to}>
            <Card className="h-full p-4 transition-colors hover:bg-accent">
              <CardTitle className="text-base">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
