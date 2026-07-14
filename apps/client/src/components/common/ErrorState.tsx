import type { JSX } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  readonly message?: string;
  readonly onRetry?: () => void;
  readonly supportHref?: string;
}

const ErrorState = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
  supportHref,
}: ErrorStateProps): JSX.Element => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertTriangle className="text-destructive h-10 w-10" />
      <p className="text-base font-medium">{message}</p>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline">
          Retry
        </Button>
      ) : null}
      {supportHref ? (
        <a href={supportHref} className="text-muted-foreground text-sm underline">
          Contact support
        </a>
      ) : null}
    </div>
  );
};

export default ErrorState;
