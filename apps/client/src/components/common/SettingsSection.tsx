import type { JSX, ReactNode } from 'react';

interface SettingsSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}

// Groups related fields within a SettingsCard (e.g. "Password Policy" inside
// Security Settings) - a lighter-weight heading than a nested Card, since it lives
// inside one already.
const SettingsSection = ({ title, description, children }: SettingsSectionProps): JSX.Element => (
  <section className="space-y-4">
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

export default SettingsSection;
