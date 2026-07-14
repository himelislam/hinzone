import { useState } from 'react';
import type { ComponentProps, JSX } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PasswordStrength {
  readonly score: 0 | 1 | 2 | 3 | 4;
  readonly label: string;
}

const STRENGTH_LABELS: ReadonlyArray<string> = [
  'Very weak',
  'Weak',
  'Fair',
  'Strong',
  'Very strong',
];

// Structural hint only, mirroring shared-validation's passwordSchema criteria -
// the backend is the source of truth for whether a password is actually accepted.
const getPasswordStrength = (password: string): PasswordStrength => {
  const criteria = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = Math.min(4, criteria.filter(Boolean).length) as PasswordStrength['score'];

  return { score, label: STRENGTH_LABELS[score] };
};

const STRENGTH_BAR_COLOR: Record<PasswordStrength['score'], string> = {
  0: 'bg-destructive',
  1: 'bg-destructive',
  2: 'bg-muted-foreground',
  3: 'bg-primary',
  4: 'bg-primary',
};

interface PasswordFieldProps extends Omit<ComponentProps<'input'>, 'type'> {
  readonly showStrengthHint?: boolean;
}

const PasswordField = ({
  className,
  showStrengthHint = false,
  value,
  ...props
}: PasswordFieldProps): JSX.Element => {
  const [isVisible, setIsVisible] = useState(false);
  const passwordValue = typeof value === 'string' ? value : '';
  const strength = showStrengthHint && passwordValue ? getPasswordStrength(passwordValue) : null;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          type={isVisible ? 'text' : 'password'}
          className={cn('pr-9', className)}
          value={value}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setIsVisible((previous) => !previous)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>

      {strength ? (
        <div className="space-y-1">
          <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
            <div
              className={cn('h-full transition-all', STRENGTH_BAR_COLOR[strength.score])}
              style={{ width: `${(strength.score / 4) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">{strength.label}</p>
        </div>
      ) : null}
    </div>
  );
};

export default PasswordField;
