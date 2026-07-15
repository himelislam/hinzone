import type { JSX, ReactNode } from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SettingsCardProps {
  readonly title: string;
  readonly description?: string;
  /** e.g. a Save button - rendered top-right, next to the title. */
  readonly action?: ReactNode;
  readonly children: ReactNode;
}

// One category's editable settings, shown as a single card (docs/20-settings-system.md
// #20's per-category admin panel sections) - the same shell for every category, only
// title/description/fields differ. Mirrors AuthCard.tsx's role for the auth pages.
const SettingsCard = ({ title, description, action, children }: SettingsCardProps): JSX.Element => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      {description ? <CardDescription>{description}</CardDescription> : null}
      {action ? <CardAction>{action}</CardAction> : null}
    </CardHeader>
    <CardContent className="space-y-6">{children}</CardContent>
  </Card>
);

export default SettingsCard;
