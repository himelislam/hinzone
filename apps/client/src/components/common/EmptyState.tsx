import type { JSX, ReactNode } from 'react';
import { Inbox } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps): JSX.Element => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="text-muted-foreground">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <p className="text-base font-medium">{title}</p>
      {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
