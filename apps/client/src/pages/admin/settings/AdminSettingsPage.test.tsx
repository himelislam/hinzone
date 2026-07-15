import { describe, expect, it } from 'vitest';

import { renderWithProviders, screen } from '@/test/render';

import AdminSettingsPage from './AdminSettingsPage';

describe('AdminSettingsPage', () => {
  it('links out to every one of the 10 settings categories', () => {
    renderWithProviders(<AdminSettingsPage />);

    const expectedLinks: ReadonlyArray<[string, string]> = [
      ['General', '/admin/settings/general'],
      ['Currency', '/admin/settings/currency'],
      ['Deposit', '/admin/settings/deposit'],
      ['Withdrawal', '/admin/settings/withdrawal'],
      ['Trading', '/admin/settings/trading'],
      ['Stocks', '/admin/settings/stocks'],
      ['MLM', '/admin/settings/mlm'],
      ['Homepage', '/admin/settings/homepage'],
      ['Notification', '/admin/settings/notifications'],
      ['Security', '/admin/settings/security'],
    ];

    for (const [title, href] of expectedLinks) {
      expect(screen.getByRole('link', { name: new RegExp(title) })).toHaveAttribute('href', href);
    }
  });
});
