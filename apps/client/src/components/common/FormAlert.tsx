import type { JSX } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

const FORM_ALERT_ICONS = {
  destructive: AlertCircle,
  success: CheckCircle2,
} as const;

interface FormAlertProps {
  readonly variant: keyof typeof FORM_ALERT_ICONS;
  readonly message: string | null | undefined;
}

// Every auth/profile form surfaces its server-side success or error message the
// same way - a single reusable alert instead of repeating the same Alert +
// AlertDescription + icon block in every form.
const FormAlert = ({ variant, message }: FormAlertProps): JSX.Element | null => {
  if (!message) {
    return null;
  }

  const Icon = FORM_ALERT_ICONS[variant];

  return (
    <Alert variant={variant}>
      <Icon />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};

export default FormAlert;
