import type { JSX } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  readonly message?: string;
}

const LoadingState = ({ message = 'Loading...' }: LoadingStateProps): JSX.Element => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
};

export default LoadingState;
