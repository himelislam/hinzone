import type { ComponentProps, JSX } from 'react';
import { useId } from 'react';

import { Switch } from '@/components/ui/switch';

interface ToggleSwitchProps extends Omit<ComponentProps<typeof Switch>, 'id'> {
  readonly label: string;
  readonly description?: string;
  readonly id?: string;
}

// A labeled on/off row (e.g. Deposits Enabled, Maintenance Mode) - every boolean
// field across Phase 03's settings categories uses this instead of a bare
// checkbox, so toggles look and behave identically everywhere.
const ToggleSwitch = ({ label, description, id, ...props }: ToggleSwitchProps): JSX.Element => {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <label htmlFor={switchId} className="text-sm leading-none font-medium">
          {label}
        </label>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      <Switch id={switchId} {...props} />
    </div>
  );
};

export default ToggleSwitch;
